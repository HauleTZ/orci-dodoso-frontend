const { createProxyMiddleware } = require('http-proxy-middleware');


module.exports = function (app) {
    // 1. External APIs (Specific paths first)

    // Departments & Sections -> Extra Duty API
    app.use(
        ['/api/v1/departments', '/api/v1/sections'],
        createProxyMiddleware({
            target: 'http://192.168.1.40:2024',
            changeOrigin: true,
            logLevel: "debug",
        })
    );

    // Users -> Attendance API
    app.use(
        '/api/users',
        createProxyMiddleware({
            target: 'http://192.168.1.12:7575',
            changeOrigin: true,
            logLevel: "debug",
        })
    );

    // 2. Django Backend (Local)
    // Matches /api/v1 but EXCLUDES departments/sections explicitly
    app.use(
        createProxyMiddleware(
            (pathname, req) => {
                return (
                    pathname.startsWith('/api/v1') &&
                    !pathname.startsWith('/api/v1/departments') &&
                    !pathname.startsWith('/api/v1/sections')
                );
            },
            {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                logLevel: "debug",
            }
        )
    );

    // 3. General Fallback -> ORCI Web Portal
    // Catches any other /api requests not handled above
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://192.168.1.41',
            changeOrigin: true,
            secure: false,
        })
    );
};
