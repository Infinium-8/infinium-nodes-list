const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');

const nodesUrl = 'https://raw.githubusercontent.com/Infinium-8/infinium-nodes-json/refs/heads/master/infinium-nodes.json';

async function fetchNodes() {
    try {
        const response = await axios.get(nodesUrl);
        return response.data.nodes;
    } catch (error) {
        console.error('Error fetching nodes from GitHub:', error);
        return [];
    }
}

async function getNodeInfo(url, port) {
    try {
        const response = await axios.get(`http://${url}:${port}/getinfo`);
        const data = response.data;
        console.log(chalk.green.bold(`Add Node ${url}:${port}`));
        return { height: data.height, mempool: data.tx_pool_size, status: data.status };
    } catch (error) {
        console.error(chalk.red.bold(`Error fetching info from ${url}:${port}. The host is not available.`));
        return null;
    }
}

async function updateNodeList() {
    const nodes = await fetchNodes();
    const updatedNodes = [];

    for (const node of nodes) {
        const {url, port} = node;
        const info = await getNodeInfo(url, port);
        if (info) { 
            updatedNodes.push({
                name: node.name,
                url: node.url,
                port: node.port,
                height: info.height,
                mempool: info.mempool,
                status: info.status
            });
        } else {
            console.log(chalk.red.bold(`Node ${url}:${port} is not available and will not be added to the JSON.`));
        }
    }

    fs.writeFileSync('public/nodes.json', JSON.stringify({ nodes: updatedNodes }, null, 2));
    console.log(chalk.cyan.bold('Update Nodes'));
    console.log(chalk.yellow.bold('Update in 5 minutes interval'))
}

updateNodeList();
setInterval(updateNodeList, 5 * 60 * 1000);

app.get('/nodes.json', (req, res) => {
    res.redirect(301, '/list/nodes/');
});

app.get('/list/nodes/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'nodes.json'));
});

app.use(express.static('public'));

const PORT = process.env.PORT || 1234;

app.listen(PORT, () => {
    console.log(chalk.blue.bold(`Server running on port ${PORT}`));
});

