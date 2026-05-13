const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/celio.veloso/Documents/Projetinho 2/Chatinho/app/api';

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Match both @/app/api/auth/[...nextauth]/route and any relative path ending in auth/[...nextauth]/route
            const regex = /['"]([^'"]*auth\/\[\.\.\.nextauth\]\/route)['"]/g;
            if (regex.test(content)) {
                console.log(`Updating ${filePath}`);
                // Replace the entire import path with @/lib/auth
                content = content.replace(regex, "'@/lib/auth'");
                fs.writeFileSync(filePath, content);
            }
        }
    });
}

walk(directory);
