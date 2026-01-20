import base64
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import unquote

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from models.conversation import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
)
from models.user import UserResponse
from models.business import AnalyticsResponse
from services.conversation import ConversationService
from services.memory_service import MemoryService
from services.evolution_service import get_evolution_service

router = APIRouter()

# Initialize services
conversation_service = ConversationService()
memory_service = MemoryService()

# Simple in-memory cache for contacts (refreshes every 5 minutes)
_contacts_cache: Dict[str, Any] = {
    "data": {},
    "timestamp": 0,
    "ttl": 300  # 5 minutes
}

# Messages cache (refreshes every 30 seconds per chat)
_messages_cache: Dict[str, Dict[str, Any]] = {}

# Group names cache (refreshes every 5 minutes)
_group_names_cache: Dict[str, Any] = {
    "data": {},
    "timestamp": 0,
    "ttl": 300  # 5 minutes
}

async def get_group_name(group_jid: str) -> Optional[str]:
    """Get the real name (subject) of a group with caching."""
    global _group_names_cache
    
    # Check cache first
    if group_jid in _group_names_cache["data"]:
        return _group_names_cache["data"][group_jid]
    
    # Fetch from API
    try:
        evolution_service = get_evolution_service()
        group_info = await evolution_service.get_group_info(group_jid)
        if group_info:
            subject = group_info.get("subject")
            if subject:
                _group_names_cache["data"][group_jid] = subject
                return subject
    except Exception as e:
        logger.warning(f"Failed to fetch group info for {group_jid}: {e}")
    
    return None

async def get_cached_contacts() -> Dict[str, Any]:
    """Get contacts with caching to avoid repeated API calls."""
    global _contacts_cache
    
    current_time = time.time()
    
    # Check if cache is valid
    if _contacts_cache["data"] and (current_time - _contacts_cache["timestamp"]) < _contacts_cache["ttl"]:
        return _contacts_cache["data"]
    
    # Fetch fresh contacts
    evolution_service = get_evolution_service()
    contacts = await evolution_service.get_contacts(limit=1000)
    
    contacts_map = {}
    for contact in contacts:
        jid = contact.get("remoteJid", "")
        if not jid:
            continue
            
        name = contact.get("pushName") or contact.get("name")
        if not name or name in ["Você", "You", "أنت", "Yo"]:
            continue
            
        contact_data = {
            "name": name,
            "subject": contact.get("subject") or None,
            "profile_pic": contact.get("profilePicUrl"),
            "is_group": contact.get("isGroup", False) or contact.get("type") == "group"
        }
        
        contacts_map[jid] = contact_data
        
        # Also map by cleaned phone number
        clean_phone = clean_phone_number(jid)
        if clean_phone and clean_phone != jid:
            contacts_map[clean_phone] = contact_data
    
    # Update cache
    _contacts_cache["data"] = contacts_map
    _contacts_cache["timestamp"] = current_time
    
    return contacts_map


@router.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "leblebbot",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process chat message and generate AI response.
    """
    # Build user identifier
    identifier = {}
    if request.phone:
        identifier["phone"] = request.phone
        identifier["whatsapp_id"] = request.phone
    if request.user_id:
        identifier["_id"] = request.user_id
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Phone or user_id required")
    
    # Process message
    result = await conversation_service.process_message(
        user_identifier=identifier,
        message=request.message,
        channel=request.channel,
        message_type=request.message_type,
        media_url=request.media_url
    )
    
    return ChatResponse(**result)


@router.get("/conversations")
async def get_conversations(
    status: Optional[str] = Query(None, description="Filter by status: active, closed"),
    escalated: Optional[bool] = Query(None, description="Filter escalated only"),
    channel: Optional[str] = Query(None, description="Filter by channel: whatsapp, messenger, telegram, website"),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
):
    """Get all conversations with pagination"""
    # Build query
    query = {}
    if status:
        query["status"] = status
    if escalated is not None:
        query["escalated"] = escalated
    if channel:
        query["channel"] = channel
    
    cursor = memory_service.conversations.find(query).sort(
        "updated_at", -1
    ).skip(offset).limit(limit)
    
    conversations = await cursor.to_list(length=limit)
    
    # Enrich with user info and last message
    result = []
    for conv in conversations:
        # Get user
        user = await memory_service.get_user(conv["user_id"])
        if user:
            conv["user"] = {
                "name": user.get("name"),
                "phone": user.get("phone"),
                "tags": user.get("tags", [])
            }
        
        # Get last message
        messages = await memory_service.get_recent_messages(conv["_id"], limit=1)
        if messages:
            conv["last_message"] = messages[-1]["content"]
        
        result.append(ConversationResponse.from_db(conv))
    
    # Get total count
    total = await memory_service.conversations.count_documents(query)
    
    return {
        "items": result,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get single conversation with messages (chronologically ordered)"""
    conv = await memory_service.conversations.find_one({"_id": conversation_id})
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get user
    user = await memory_service.get_user(conv["user_id"])
    if user:
        conv["user"] = {
            "id": user.get("_id"),
            "name": user.get("name"),
            "phone": user.get("phone"),
            "email": user.get("email"),
            "tags": user.get("tags", []),
            "order_count": user.get("order_count", 0),
            "total_spent": user.get("total_spent", 0)
        }
    
    # Get all messages in chronological order
    messages = await memory_service.get_all_messages(conversation_id)
    
    return {
        "conversation": ConversationResponse.from_db(conv),
        "messages": [MessageResponse.from_db(m) for m in messages],
        "user": conv.get("user")
    }


@router.post("/conversations/{conversation_id}/close")
async def close_conversation(conversation_id: str, resolved: bool = True):
    """Close a conversation"""
    success = await memory_service.close_conversation(conversation_id, resolved)
    
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"success": True, "message": "Conversation closed"}


@router.get("/users")
async def get_users(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
):
    """Get all users with pagination"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if tag:
        query["tags"] = tag
    
    cursor = memory_service.users.find(query).sort(
        "last_contact", -1
    ).skip(offset).limit(limit)
    
    users = await cursor.to_list(length=limit)
    total = await memory_service.users.count_documents(query)
    
    return {
        "items": [UserResponse.from_db(u) for u in users],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get single user with history"""
    user = await memory_service.get_user(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get conversation history
    conversations = await memory_service.conversations.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    return {
        "user": UserResponse.from_db(user),
        "conversations": [ConversationResponse.from_db(c) for c in conversations]
    }


@router.get("/analytics")
async def get_analytics(days: int = Query(7, le=30)):
    """Get analytics data with platform stats from Evolution API"""
    since = datetime.utcnow() - timedelta(days=days)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get Evolution API stats
    evolution_service = get_evolution_service()
    platform_stats = await evolution_service.get_platform_stats()
    
    # Conversation stats from MongoDB
    total_conversations = await memory_service.conversations.count_documents({
        "created_at": {"$gte": since}
    })
    
    active_conversations = await memory_service.conversations.count_documents({
        "status": "active"
    })
    
    resolved_conversations = await memory_service.conversations.count_documents({
        "created_at": {"$gte": since},
        "resolved": True
    })
    
    escalated_conversations = await memory_service.conversations.count_documents({
        "created_at": {"$gte": since},
        "escalated": True
    })
    
    # User stats
    total_users = await memory_service.users.count_documents({})
    
    active_users_today = await memory_service.users.count_documents({
        "last_contact": {"$gte": today}
    })
    
    new_users_today = await memory_service.users.count_documents({
        "created_at": {"$gte": today}
    })
    
    # Message stats - combine MongoDB and Evolution API
    mongodb_messages = await memory_service.messages.count_documents({
        "timestamp": {"$gte": since}
    })
    
    messages_today = await memory_service.messages.count_documents({
        "timestamp": {"$gte": today}
    })
    
    # Use Evolution API message count if higher (more accurate for WhatsApp)
    evolution_messages = platform_stats.get("whatsapp", {}).get("total", 0)
    total_messages = max(mongodb_messages, evolution_messages)
    
    # Calculate rates
    resolution_rate = resolved_conversations / total_conversations if total_conversations > 0 else 0
    
    # Sentiment distribution
    sentiment_pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiment_cursor = memory_service.conversations.aggregate(sentiment_pipeline)
    sentiment_data = await sentiment_cursor.to_list(length=10)
    sentiment_distribution = {
        s["_id"]: s["count"] for s in sentiment_data if s["_id"]
    }
    
    # Hourly traffic for today from MongoDB
    hourly_pipeline = [
        {"$match": {"timestamp": {"$gte": today}}},
        {"$group": {
            "_id": {"$hour": "$timestamp"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    hourly_cursor = memory_service.messages.aggregate(hourly_pipeline)
    hourly_data = await hourly_cursor.to_list(length=24)
    
    # Fill in all 24 hours with 0 for missing hours
    hourly_map = {h["_id"]: h["count"] for h in hourly_data}
    hourly_traffic = [
        {"hour": h, "count": hourly_map.get(h, 0)} for h in range(24)
    ]
    
    # Channel breakdown by conversations
    channel_pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": "$channel", "count": {"$sum": 1}}}
    ]
    channel_cursor = memory_service.conversations.aggregate(channel_pipeline)
    channel_data = await channel_cursor.to_list(length=10)
    conversations_by_channel = {
        c["_id"]: c["count"] for c in channel_data if c["_id"]
    }
    
    return {
        "total_conversations": total_conversations,
        "active_conversations": active_conversations,
        "resolved_conversations": resolved_conversations,
        "escalated_conversations": escalated_conversations,
        "resolution_rate": resolution_rate,
        "total_users": total_users,
        "active_users_today": active_users_today,
        "new_users_today": new_users_today,
        "total_messages": total_messages,
        "messages_today": messages_today,
        "avg_response_time": 1.8,  # TODO: Calculate from actual data
        "csat_score": 0.94,  # TODO: Calculate from feedback
        "sentiment_distribution": sentiment_distribution,
        "hourly_traffic": hourly_traffic,
        "top_intents": [],
        # New fields for enhanced analytics
        "platform_stats": platform_stats,
        "conversations_by_channel": conversations_by_channel,
        "active_by_platform": {
            "whatsapp": 1 if platform_stats.get("whatsapp", {}).get("connected") else 0,
            "messenger": 0,
            "instagram": 0
        }
    }


@router.get("/live-stats")
async def get_live_stats():
    """
    Get real-time statistics for the monitor dashboard.
    Combines Evolution API data with MongoDB conversation data.
    """
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get Evolution API live stats
    evolution_service = get_evolution_service()
    evolution_stats = await evolution_service.get_live_stats()
    
    # Get active conversations from MongoDB
    active_conversations = await memory_service.conversations.count_documents({
        "status": "active"
    })
    
    # Get messages today from MongoDB
    messages_today = await memory_service.messages.count_documents({
        "timestamp": {"$gte": today}
    })
    
    # Merge stats
    return {
        "total_messages": evolution_stats.get("total_messages", 0),
        "total_contacts": evolution_stats.get("total_contacts", 0),
        "total_chats": evolution_stats.get("total_chats", 0),
        "active_conversations": active_conversations or evolution_stats.get("active_conversations", 0),
        "messages_today": messages_today or evolution_stats.get("messages_today", 0),
        "platforms": evolution_stats.get("platforms", {}),
        "sync_status": evolution_stats.get("sync_status", {}),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/recent-conversations")
async def get_recent_conversations(limit: int = Query(20, le=50)):
    """
    Get recent conversations for live monitor.
    Returns conversations from both MongoDB and Evolution API.
    """
    # First try to get from MongoDB (processed conversations)
    cursor = memory_service.conversations.find({}).sort(
        "updated_at", -1
    ).limit(limit)
    
    mongodb_conversations = await cursor.to_list(length=limit)
    
    result = []
    for conv in mongodb_conversations:
        # Get user info
        user = await memory_service.get_user(conv["user_id"])
        
        # Get last message
        messages = await memory_service.get_recent_messages(conv["_id"], limit=1)
        last_message = messages[-1]["content"] if messages else ""
        
        result.append({
            "id": conv["_id"],
            "phone": user.get("phone", "") if user else "",
            "name": user.get("name") or user.get("phone", "Unknown") if user else "Unknown",
            "last_message": last_message[:100] if last_message else "",
            "time": conv.get("updated_at", datetime.utcnow()).isoformat(),
            "platform": conv.get("channel", "whatsapp"),
            "status": "active" if conv.get("status") == "active" else "inactive",
            "unread": 0,
            "escalated": conv.get("escalated", False)
        })
    
    # If no MongoDB conversations, try Evolution API
    if not result:
        evolution_service = get_evolution_service()
        evolution_conversations = await evolution_service.get_recent_conversations(limit=limit)
        
        for conv in evolution_conversations:
            # Format time
            timestamp = conv.get("last_message_time")
            if timestamp:
                time_str = datetime.fromtimestamp(timestamp).isoformat() if isinstance(timestamp, (int, float)) else str(timestamp)
            else:
                time_str = datetime.utcnow().isoformat()
            
            result.append({
                "id": conv.get("id", ""),
                "phone": conv.get("phone", ""),
                "name": conv.get("name", conv.get("phone", "Unknown")),
                "last_message": conv.get("last_message", "")[:100],
                "time": time_str,
                "platform": conv.get("platform", "whatsapp"),
                "status": conv.get("status", "inactive"),
                "unread": conv.get("unread_count", 0),
                "escalated": False
            })
    
    return {
        "items": result,
        "total": len(result)
    }


@router.get("/knowledge")
async def get_knowledge(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    """Get knowledge base items"""
    query = {}
    
    if category:
        query["category"] = category
    
    if search:
        # Search in ChromaDB if available
        results = await memory_service.search_knowledge(search, limit=limit)
        return {"items": [{"content": r} for r in results]}
    
    cursor = memory_service.knowledge.find(query).limit(limit)
    items = await cursor.to_list(length=limit)
    
    return {"items": items}


@router.post("/knowledge")
async def add_knowledge(content: str, category: str = "general"):
    """Add item to knowledge base"""
    success = await memory_service.add_knowledge(content, category)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add knowledge")
    
    return {"success": True, "message": "Knowledge added"}


# ===================
# WhatsApp Chats (Evolution API)
# ===================

def clean_phone_number(jid: str) -> str:
    """
    Clean phone number from JID format.
    Removes @lid, @s.whatsapp.net, @g.us suffixes and handles group IDs.
    Returns empty string if the number is too long to be a real phone number.
    """
    # Remove suffixes
    phone = jid.replace("@s.whatsapp.net", "").replace("@g.us", "").replace("@lid", "")
    
    # Handle group IDs with format like "201141689099-1600219065"
    if "-" in phone and len(phone) > 13:
        # Take the first part before the dash
        parts = phone.split("-")
        phone = parts[0]
    
    # Handle very long group IDs that start with "120363..." (timestamp + phone pattern)
    # Example: "120363423193357795" -> extract phone part
    if phone.startswith("120") and len(phone) > 15:
        # Group IDs are timestamp + phone, extract the phone part (last 10-12 digits)
        phone = phone[-10:]
    
    # Handle @lid JIDs - they have a format like "38041112592620"
    # The prefix (e.g., "38") is internal WhatsApp routing, remove it to get actual phone
    elif phone.startswith("38") and len(phone) > 12:
        # Remove the "38" prefix for @lid numbers
        phone = phone[2:]
    elif phone.startswith("19") and len(phone) > 12:
        # Another common @lid prefix
        phone = phone[2:]
    
    # For other very long numbers (> 15 digits), it's likely an internal ID
    # Real phone numbers are max 15 digits (including country code)
    # Return empty to signal this is not a real phone number
    if len(phone) > 15:
        return ""
    
    # For moderately long numbers (13-15), take last 12 digits
    elif len(phone) > 13:
        phone = phone[-12:]
    
    return phone


@router.get("/whatsapp/chats")
async def get_whatsapp_chats(
    limit: int = Query(50, le=200),
    search: Optional[str] = Query(None, description="Search by name or phone"),
    show_banned: bool = Query(False, description="Include banned users")
):
    """
    Get all WhatsApp chats directly from Evolution API.
    Returns chats with last message preview, profile pics, proper names, and unread counts.
    Deduplicates by remoteJid and merges contact names.
    Uses cached contacts for faster loading.
    """
    evolution_service = get_evolution_service()
    
    # Get cached contacts for name resolution (fast!)
    contacts_map = await get_cached_contacts()
    
    # Fetch chats
    chats = await evolution_service.get_chats(limit=limit * 2)  # Fetch more to account for dedup
    
    # Get banned users from MongoDB
    banned_users = set()
    try:
        banned_cursor = memory_service.db.banned_users.find({})
        async for doc in banned_cursor:
            banned_users.add(doc.get("phone", ""))
    except Exception:
        pass
    
    # First pass: collect all phone numbers that have @s.whatsapp.net chats
    # This helps us filter out @lid duplicates
    phones_with_normal_jid = set()
    for chat in chats:
        remote_jid = chat.get("remoteJid", "")
        if "@s.whatsapp.net" in remote_jid:
            phone = clean_phone_number(remote_jid)
            phones_with_normal_jid.add(phone)
    
    # Deduplicate by remoteJid using dict
    seen_jids = {}
    
    for chat in chats:
        remote_jid = chat.get("remoteJid", "")
        if not remote_jid:
            continue
            
        # Skip duplicates - keep the most recent one
        if remote_jid in seen_jids:
            continue
        seen_jids[remote_jid] = True
        
        # Filter empty conversations - must have lastMessage OR unreadCount > 0
        last_msg = chat.get("lastMessage")
        unread = chat.get("unreadCount", 0)
        if not last_msg and unread == 0:
            continue
        
        is_group = "@g.us" in remote_jid
        is_lid = "@lid" in remote_jid
        phone = clean_phone_number(remote_jid)
        
        # Skip all @lid chats - they are internal WhatsApp IDs that often duplicate
        # the @s.whatsapp.net chats and don't contain real phone numbers
        if is_lid:
            continue
        
        # Get name - improved logic with multiple fallbacks
        contact_info = contacts_map.get(remote_jid, {})
        if not contact_info:
            # Try cleaned phone number
            contact_info = contacts_map.get(phone, {})
        
        if is_group:
            # For groups, ALWAYS fetch the real group subject from API first
            # This is the most reliable source for group names
            real_group_name = await get_group_name(remote_jid)
            
            if real_group_name:
                name = real_group_name
            else:
                # Fallback to other sources only if API didn't return a name
                contact_group_name = contact_info.get("subject") or contact_info.get("name")
                name = (
                    chat.get("subject") or              # Group subject
                    contact_group_name or 
                    f"مجموعة {phone[-4:]}"              # Final fallback
                )
        else:
            # For individuals, try multiple name fields in priority order
            name = (
                contact_info.get("name") or         # From contacts (best)
                chat.get("notify") or               # Notify name (good source)
                chat.get("verifiedName") or         # Verified name  
                chat.get("pushName") or             # Push name
                chat.get("name") or                 # Chat name
                (last_msg.get("pushName") if last_msg else None) or  # Last message sender
                phone                               # Final fallback
            )
        
        # Skip if name is still self-reference
        if name in ["Você", "You", "أنت", "Yo"]:
            continue
        
        # Get profile picture from contacts or chat
        profile_pic = (
            contact_info.get("profile_pic") or 
            chat.get("profilePicUrl")
        )
        
        # Check if banned
        is_banned = phone in banned_users
        
        # Skip banned users unless explicitly requested
        if is_banned and not show_banned:
            continue
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            if search_lower not in name.lower() and search_lower not in phone:
                continue
        
        # Get last message content with better type detection
        last_msg = chat.get("lastMessage", {})
        last_message_content = ""
        last_msg_type = "text"
        
        if last_msg:
            msg = last_msg.get("message", {})
            msg_type = last_msg.get("messageType", "")
            
            # Determine message type and content
            if msg.get("conversation"):
                last_message_content = msg.get("conversation")
            elif msg.get("extendedTextMessage", {}).get("text"):
                last_message_content = msg.get("extendedTextMessage", {}).get("text")
            elif msg_type == "imageMessage" or msg.get("imageMessage"):
                last_message_content = "📷 صورة"
                last_msg_type = "image"
            elif msg_type == "videoMessage" or msg.get("videoMessage"):
                last_message_content = "🎥 فيديو"
                last_msg_type = "video"
            elif msg_type == "audioMessage" or msg.get("audioMessage"):
                last_message_content = "🎤 رسالة صوتية"
                last_msg_type = "audio"
            elif msg_type == "stickerMessage" or msg.get("stickerMessage"):
                last_message_content = "🏷️ ملصق"
                last_msg_type = "sticker"
            elif msg_type == "documentMessage" or msg.get("documentMessage"):
                last_message_content = "📄 " + msg.get("documentMessage", {}).get("fileName", "مستند")
                last_msg_type = "document"
            elif msg_type == "reactionMessage" or msg.get("reactionMessage"):
                emoji = msg.get("reactionMessage", {}).get("text", "👍")
                last_message_content = f"تفاعل {emoji}"
                last_msg_type = "reaction"
            else:
                last_message_content = "[رسالة]"
        
        # Get timestamp
        timestamp = last_msg.get("messageTimestamp")
        if timestamp:
            try:
                time_str = datetime.fromtimestamp(int(timestamp)).isoformat()
            except:
                time_str = datetime.utcnow().isoformat()
        else:
            time_str = chat.get("updatedAt") or datetime.utcnow().isoformat()
    
        # For @lid chats, use name as phone since it's not a real number
        is_lid = "@lid" in remote_jid
        display_phone = name if is_lid else phone
        
        # Only add if we haven't reached the limit
        if len(seen_jids) <= limit:
            seen_jids[remote_jid] = {
                "id": remote_jid,
                "remote_jid": remote_jid,
                "phone": display_phone,
                "name": name,
                "last_message": last_message_content[:100] if last_message_content else "",
                "last_message_type": last_msg_type,
                "last_message_time": time_str,
                "unread_count": chat.get("unreadCount", 0),
                "is_group": is_group,
                "profile_pic": profile_pic,
                "is_banned": is_banned,
                "platform": "whatsapp"
            }
    
    # Convert to list and sort by last message time (most recent first)
    result = [v for v in seen_jids.values() if isinstance(v, dict)]
    result.sort(key=lambda x: x.get("last_message_time", ""), reverse=True)
    
    # Limit results
    result = result[:limit]
    
    return {
        "items": result,
        "total": len(result)
    }


@router.get("/whatsapp/chats/{remote_jid:path}/messages")
async def get_whatsapp_chat_messages(
    remote_jid: str,
    limit: int = Query(50, le=200),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    force_refresh: bool = Query(False, description="Force refresh from API")
):
    """
    Get messages for a specific WhatsApp chat from Evolution API.
    Enhanced with sender info for groups and media URLs via proxy.
    Uses cached contacts and messages for faster loading.
    Supports pagination via page parameter.
    """
    global _messages_cache
    
    # URL decode the remote_jid (it might be encoded)
    remote_jid = unquote(remote_jid)
    
    # Check messages cache (30 second TTL) - include page in cache key
    cache_key = f"{remote_jid}:{limit}:{page}"
    current_time = time.time()
    
    if not force_refresh and cache_key in _messages_cache:
        cached = _messages_cache[cache_key]
        if current_time - cached["timestamp"] < 30:  # 30 second cache
            return cached["data"]
    
    evolution_service = get_evolution_service()
    is_group = "@g.us" in remote_jid
    is_lid = "@lid" in remote_jid
    
    # Fetch contacts for both groups and 1:1 (avatar/name resolution)
    # Uses cache to avoid slow repeated API calls
    contacts_map = await get_cached_contacts()
    
    # For @lid chats, get owner JID to fix fromMe detection
    owner_jid = None
    if is_lid:
        try:
            instance_info = await evolution_service._request(
                "GET",
                f"/instance/fetchInstances?instanceName={evolution_service.instance_name}"
            )
            if instance_info.get("success") and instance_info.get("data"):
                data = instance_info["data"]
                if isinstance(data, list) and len(data) > 0:
                    owner_jid = data[0].get("ownerJid", "").replace("@s.whatsapp.net", "")
        except Exception:
            pass
    
    # Get messages from Evolution API with pagination
    messages_data = await evolution_service.get_messages(remote_jid, limit=limit, page=page)
    messages = messages_data.get("records", [])
    messages_total = messages_data.get("total", len(messages))
    
    # Track seen message IDs to prevent duplicates
    seen_ids = set()
    result = []
    
    # For groups, fetch participants to get the @lid to phone number mapping
    # This is the most reliable source for real phone numbers
    group_participants_map = {}
    if is_group:
        try:
            participants = await evolution_service.get_group_participants(remote_jid)
            for p in participants:
                lid_id = p.get("id", "")
                phone_number = p.get("phoneNumber", "")
                if lid_id and phone_number:
                    group_participants_map[lid_id] = phone_number
        except Exception as e:
            logger.warning(f"Failed to fetch group participants: {e}")
    
    # First pass: build a mapping from @lid to real phone number using participantAlt
    # This helps us resolve @lid participants even in older messages
    lid_to_phone_map = {}
    for msg in messages:
        key = msg.get("key", {})
        participant_lid = key.get("participant", "")
        participant_alt = key.get("participantAlt", "")
        if participant_lid and "@lid" in participant_lid and participant_alt and "@s.whatsapp.net" in participant_alt:
            lid_to_phone_map[participant_lid] = participant_alt
    
    # Merge group_participants_map into lid_to_phone_map (group participants take precedence)
    lid_to_phone_map.update(group_participants_map)
    
    for msg in messages:
        key = msg.get("key", {})
        msg_id = key.get("id", "")
        from_me = key.get("fromMe", False)
        
        # For @lid chats, fromMe is often incorrectly set to False
        # Use source field or remoteJidAlt to try to determine direction
        if is_lid and not from_me and owner_jid:
            # Check if source indicates it's from our device
            source = msg.get("source", "")
            remote_jid_alt = key.get("remoteJidAlt", "")
            
            # If remoteJidAlt is NOT our JID, and it matches the contact, then we sent it
            if remote_jid_alt and owner_jid not in remote_jid_alt:
                # This message was sent BY us TO the contact
                # Actually for @lid this logic is inverted - if remoteJidAlt is the contact, we sent it
                pass
            
            # Check if message ID starts with "3A" or "3EB" (typically from our devices)
            # @lid messages from contacts typically start with different prefixes
            if msg_id.startswith("3A") or msg_id.startswith("3EB"):
                from_me = True
        
        # Skip duplicates
        if msg_id in seen_ids:
            continue
        seen_ids.add(msg_id)
        
        message_data = msg.get("message", {})
        
        # Extract message content
        content = (
            message_data.get("conversation") or
            message_data.get("extendedTextMessage", {}).get("text") or
            message_data.get("imageMessage", {}).get("caption") or
            message_data.get("videoMessage", {}).get("caption") or
            ""
        )
        
        # Clean up mentions in content - replace @lid IDs with proper names
        # Pattern: @119322932424873 or similar long number mentions
        import re
        if content:
            # Find all @ mentions with numbers (potential @lid references)
            mention_pattern = r'@(\d{10,})'
            matches = re.findall(mention_pattern, content)
            for match in matches:
                # Check if this is a long internal ID (> 15 digits)
                if len(match) > 15:
                    # Replace with @مشارك
                    content = content.replace(f'@{match}', '@مشارك')
                else:
                    # Try to find a proper name for this number
                    lid_jid = f'{match}@lid'
                    if lid_jid in lid_to_phone_map:
                        # Get the real phone number
                        real_phone = lid_to_phone_map[lid_jid].replace('@s.whatsapp.net', '')
                        # Try to get contact name for this phone
                        contact = contacts_map.get(real_phone, {})
                        name = contact.get("name", "")
                        if name and not name.isdigit():
                            content = content.replace(f'@{match}', f'@{name}')
                        else:
                            content = content.replace(f'@{match}', f'@{real_phone}')
        
        # Determine message type and extract media info
        msg_type = "text"
        media_url = None
        media_mimetype = None
        media_duration = None
        has_media = False
        
        if message_data.get("imageMessage"):
            msg_type = "image"
            img_msg = message_data.get("imageMessage", {})
            media_mimetype = img_msg.get("mimetype")
            has_media = True
            content = content or ""
        elif message_data.get("videoMessage"):
            msg_type = "video"
            vid_msg = message_data.get("videoMessage", {})
            media_mimetype = vid_msg.get("mimetype")
            media_duration = vid_msg.get("seconds")
            has_media = True
            content = content or ""
        elif message_data.get("audioMessage"):
            aud_msg = message_data.get("audioMessage", {})
            media_mimetype = aud_msg.get("mimetype")
            media_duration = aud_msg.get("seconds")
            is_ptt = aud_msg.get("ptt", False)  # Push-to-talk (voice note)
            msg_type = "voice" if is_ptt else "audio"
            has_media = True
            content = ""
        elif message_data.get("documentMessage"):
            msg_type = "document"
            doc_msg = message_data.get("documentMessage", {})
            media_mimetype = doc_msg.get("mimetype")
            has_media = True
            content = doc_msg.get("fileName", "Document")
        elif message_data.get("stickerMessage"):
            msg_type = "sticker"
            sticker_msg = message_data.get("stickerMessage", {})
            media_mimetype = sticker_msg.get("mimetype")
            has_media = True
            content = ""
        elif message_data.get("reactionMessage"):
            msg_type = "reaction"
            content = message_data.get("reactionMessage", {}).get("text", "")
        
        # Build media proxy URL if message has media
        if has_media and msg_id:
            from urllib.parse import quote
            encoded_jid = quote(remote_jid, safe="")
            media_url = f"/media/{msg_id}?remote_jid={encoded_jid}&from_me={str(from_me).lower()}"
        
        # Get timestamp
        timestamp = msg.get("messageTimestamp")
        if timestamp:
            try:
                time_str = datetime.fromtimestamp(int(timestamp)).isoformat()
            except:
                time_str = datetime.utcnow().isoformat()
        else:
            time_str = datetime.utcnow().isoformat()
        
        # Get sender info - prioritize pushName from message (most reliable for group messages)
        push_name = msg.get("pushName", "")
        sender_name = push_name
        sender_jid = None
        sender_pic = None
        delivery_status = msg.get("ack")
        if delivery_status is None:
            delivery_status = msg.get("status")
        
        if is_group and not from_me:
            # Get participant info for group messages
            # Prefer participantAlt (real phone number) over participant (@lid internal ID)
            participant_lid = key.get("participant", "")
            participant_alt = key.get("participantAlt", "")
            
            # If participantAlt is missing, try to get it from our mapping
            if not participant_alt and participant_lid and participant_lid in lid_to_phone_map:
                participant_alt = lid_to_phone_map[participant_lid]
            
            # Use participantAlt if it's a real phone number (@s.whatsapp.net)
            if participant_alt and "@s.whatsapp.net" in participant_alt:
                participant = participant_alt
            else:
                participant = participant_lid or participant_alt
            
            if participant:
                sender_jid = participant
                
                # Check if pushName is just a number (LID fallback) - if so, treat as no name
                is_lid_name = push_name and push_name.isdigit() and len(push_name) > 10
                
                # For @lid JIDs, the pushName from message is usually the best source
                # Only look up contacts if pushName is empty, generic, or just a LID number
                if not sender_name or sender_name in ["Você", "You", "أنت", "Yo"] or is_lid_name:
                    # Try contact lookup - first with participantAlt (real phone)
                    contact_info = {}
                    if participant_alt:
                        contact_info = contacts_map.get(participant_alt, {})
                        if not contact_info:
                            clean_alt = clean_phone_number(participant_alt)
                            contact_info = contacts_map.get(clean_alt, {})
                    
                    # Fallback to participant lookup
                    if not contact_info:
                        contact_info = contacts_map.get(participant, {})
                        if not contact_info:
                            clean_p = clean_phone_number(participant)
                            contact_info = contacts_map.get(clean_p, {})
                    
                    contact_name = contact_info.get("name", "")
                    # Only use contact name if it's not a number
                    if contact_name and not (contact_name.isdigit() and len(contact_name) > 10):
                        sender_name = contact_name
                    sender_pic = contact_info.get("profile_pic")
                
                # If still no usable name, show the real phone number
                if not sender_name or sender_name in ["Você", "You", "أنت", "Yo"] or (sender_name.isdigit() and len(sender_name) > 10):
                    # First try participantAlt (real phone number from Evolution API)
                    if participant_alt and "@s.whatsapp.net" in participant_alt:
                        clean_p = clean_phone_number(participant_alt)
                        # Only use if clean_p is valid (not empty - means it's a real phone number)
                        if clean_p:
                            sender_name = clean_p
                        elif push_name and not is_lid_name:
                            # Fallback to pushName if clean_p is empty (internal ID)
                            sender_name = push_name
                        else:
                            sender_name = "مشارك"
                    elif "@s.whatsapp.net" in participant:
                        clean_p = clean_phone_number(participant)
                        # Only use if clean_p is valid (not empty - means it's a real phone number)
                        if clean_p:
                            sender_name = clean_p
                        elif push_name and not is_lid_name:
                            # Fallback to pushName if clean_p is empty (internal ID)
                            sender_name = push_name
                        else:
                            sender_name = "مشارك"
                    else:
                        # No real phone available - use pushName if valid
                        if push_name and not is_lid_name:
                            sender_name = push_name
                        else:
                            sender_name = "مشارك"
                
                # Final safety check: if sender_name still contains @lid or is a very long number, use "مشارك"
                if sender_name and ("@lid" in sender_name or (sender_name.replace("@", "").isdigit() and len(sender_name) > 15)):
                    sender_name = "مشارك"
        
        result.append({
            "id": msg_id,
            "content": content,
            "from_me": from_me,
            "timestamp": time_str,
            "sender_name": sender_name,
            "sender_jid": sender_jid,
            "sender_pic": sender_pic,
            "status": delivery_status,
            "type": msg_type,
            "media_url": media_url,
            "media_mimetype": media_mimetype,
            "media_duration": media_duration,
            "remote_jid": key.get("remoteJid", remote_jid)
        })
    
    # Sort by timestamp (oldest first for chat display)
    result.sort(key=lambda x: x.get("timestamp", ""))
    
    # Get chat info - use cleaned phone
    phone = clean_phone_number(remote_jid)
    
    # Get chat name from contacts cache (fast - no extra API call)
    contact_info = contacts_map.get(remote_jid, {})
    if not contact_info:
        contact_info = contacts_map.get(phone, {})
    
    chat_name = None
    chat_pic = contact_info.get("profile_pic")
    
    if is_group:
        # For groups, ALWAYS fetch the real group subject from API first
        real_group_name = await get_group_name(remote_jid)
        if real_group_name:
            chat_name = real_group_name
        else:
            # Fallback to contact info
            chat_name = contact_info.get("subject") or contact_info.get("name")
            if not chat_name or chat_name in ["Você", "You", "أنت", "Yo"]:
                chat_name = f"مجموعة {phone[-6:]}" if len(phone) > 6 else f"مجموعة {phone}"
    else:
        chat_name = contact_info.get("name")
        # Skip self-reference names
        if chat_name in ["Você", "You", "أنت", "Yo"]:
            chat_name = None
        if not chat_name:
            chat_name = phone
    
    response_data = {
        "items": result,
        "total": messages_total,
        "chat": {
            "remote_jid": remote_jid,
            "phone": phone,
            "name": chat_name,
            "profile_pic": chat_pic,
            "is_group": is_group
        }
    }
    
    # Cache the response
    _messages_cache[cache_key] = {
        "data": response_data,
        "timestamp": current_time
    }
    
    return response_data


# ===================
# User Ban Management
# ===================

@router.post("/users/{phone}/ban")
async def ban_user(phone: str, reason: str = ""):
    """Ban a user by phone number"""
    try:
        await memory_service.db.banned_users.update_one(
            {"phone": phone},
            {
                "$set": {
                    "phone": phone,
                    "reason": reason,
                    "banned_at": datetime.utcnow(),
                    "banned_by": "admin"
                }
            },
            upsert=True
        )
        return {"success": True, "message": f"User {phone} has been banned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{phone}/ban")
async def unban_user(phone: str):
    """Remove ban from a user"""
    try:
        result = await memory_service.db.banned_users.delete_one({"phone": phone})
        if result.deleted_count > 0:
            return {"success": True, "message": f"User {phone} has been unbanned"}
        return {"success": False, "message": "User was not banned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/banned")
async def get_banned_users():
    """Get list of all banned users"""
    try:
        banned = []
        cursor = memory_service.db.banned_users.find({})
        async for doc in cursor:
            banned.append({
                "phone": doc.get("phone"),
                "reason": doc.get("reason", ""),
                "banned_at": doc.get("banned_at").isoformat() if doc.get("banned_at") else None,
                "banned_by": doc.get("banned_by", "")
            })
        return {"items": banned, "total": len(banned)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Media Proxy
# ===================

@router.get("/media/{message_id}")
async def get_media(
    message_id: str,
    remote_jid: str = Query(..., description="Remote JID of the chat"),
    from_me: bool = Query(False, description="Whether the message is from me")
):
    """
    Get media file from Evolution API as base64 and return as binary.
    This proxies media requests to Evolution API to handle authentication.
    Includes retry logic for transient failures.
    """
    import asyncio
    
    evolution_service = get_evolution_service()
    
    # Decode URL-encoded values
    message_id = unquote(message_id)
    remote_jid = unquote(remote_jid)
    
    # Build message key
    message_key = {
        "id": message_id,
        "remoteJid": remote_jid,
        "fromMe": from_me
    }
    
    # Retry logic - try up to 3 times with exponential backoff
    max_retries = 3
    last_error = "Media not found"
    
    for attempt in range(max_retries):
        # Get base64 media from Evolution API
        result = await evolution_service.get_media_base64(message_key)
        
        if result.get("success"):
            base64_data = result.get("base64")
            mimetype = result.get("mimetype", "application/octet-stream")
            
            if base64_data:
                # Decode base64 to binary
                try:
                    media_bytes = base64.b64decode(base64_data)
                    
                    # Return as binary response with proper content type
                    return Response(
                        content=media_bytes,
                        media_type=mimetype,
                        headers={
                            "Cache-Control": "public, max-age=86400",  # Cache for 1 day
                            "Content-Disposition": "inline",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, OPTIONS",
                            "Access-Control-Allow-Headers": "*"
                        }
                    )
                except Exception as e:
                    last_error = f"Failed to decode media: {str(e)}"
            else:
                last_error = "No media data returned"
        else:
            last_error = result.get("error", "Failed to get media")
        
        # Wait before retry (exponential backoff)
        if attempt < max_retries - 1:
            await asyncio.sleep(0.5 * (2 ** attempt))
    
    # All retries failed - return informative error
    # Determine if it's likely an expired media issue
    error_detail = last_error
    if "not found" in last_error.lower() or "failed" in last_error.lower():
        error_detail = "Media expired or unavailable. WhatsApp media may expire after some time."
    
    raise HTTPException(
        status_code=404, 
        detail=error_detail
    )


# ===================
# WhatsApp Sending
# ===================

@router.post("/whatsapp/send")
async def send_whatsapp_message(
    remote_jid: str = Query(..., description="Remote JID of recipient"),
    message: str = Query(..., description="Message text to send")
):
    """
    Send message directly to WhatsApp via Evolution API.
    Used for direct WhatsApp messaging without AI processing.
    """
    from connectors.whatsapp import WhatsAppConnector
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Initialize connector (it gets settings automatically)
        connector = WhatsAppConnector()
        
        # Extract phone number from JID
        phone = remote_jid.replace("@s.whatsapp.net", "").replace("@g.us", "")
        
        logger.info(f"Sending WhatsApp message to {phone}: {message[:50]}")
        
        # Send via WhatsApp connector - instant send without typing simulation
        result = await connector.send_message(phone, message, simulate_typing=False, vary_message=False)
        
        logger.info(f"Send result: {result}")
        
        if result.get("success"):
            return {
                "success": True, 
                "message_id": result.get("data", {}).get("key", {}).get("id"),
                "timestamp": result.get("data", {}).get("messageTimestamp")
            }
        else:
            error_msg = result.get("error", "Failed to send WhatsApp message")
            logger.error(f"Failed to send: {error_msg}")
            raise HTTPException(
                status_code=500, 
                detail=error_msg
            )
    except Exception as e:
        logger.error(f"Exception in send_whatsapp_message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
