module.exports = {
  apps: [
    {
      name: 'leblebbot-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      cwd: '/var/www/leblebbot/dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
  ],
};
