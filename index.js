const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const http = require('http');

// Ensure necessary directories
function ensurePermissions() {
    const directories = ['tmp', 'XeonMedia', 'lib', 'src'];
    directories.forEach((dir) => {
        const fullPath = path.join(__dirname, dir);
        try {
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`Created directory: ${fullPath}`);
            }
            fs.chmodSync(fullPath, 0o755); // Ensure permissions
        } catch (err) {
            console.error(`Error ensuring directory ${fullPath} exists:`, err);
            process.exit(1);
        }
    });
}

// Start the HTTP server
function startServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Your service is live\n');
    });

    const port = 3000;
    server.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

// Start the bot process
function startBot() {
    ensurePermissions();

    const mainFile = path.join(__dirname, 'main.js');
    const maxHeapSize = process.env.MAX_HEAP_SIZE || '9000'; // Default to 4 GB heap size
     const args = [`--max-old-space-size=${maxHeapSize}`, mainFile, ...process.argv.slice(2)];

    console.log(`Starting Bot with: ${['node', ...args].join(' ')}`);

    let p = spawn('node', args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    })
        .on('message', (data) => {
            if (data === 'reset') {
                console.log('Restarting Bot...');
                p.kill();
                startBot();
                delete p;
            }
        })
        .on('exit', (code) => {
            console.error('Exited with code:', code);
            if (code === 1 || code === 0) startBot();
        });
}

// Start both the server and the bot
function start() {
    startServer();
    startBot();
}

start();
