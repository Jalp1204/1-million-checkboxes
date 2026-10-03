import http from "node:http"
import express from "express"
import path from "node:path";

async function main() {
    const app=express();
    const server = http.createServer(app);

    const PORT= process.env.PORT ?? 8000;

    app.get('/health', (req,res) => res.json({healthy:true}));

    app.use(express.static(path.resolve('./public')));

    server.listen(PORT , () => {
        console.log(`server is running on http://localhost:${PORT}`);
    });
}

main();