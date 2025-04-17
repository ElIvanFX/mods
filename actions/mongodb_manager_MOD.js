module.exports = {
    name: "MongoDB Manager",
    section: "Database",
    meta: {
        version: '2.1.7',
        preciseCheck: true,
        author: '[Ivan FX - 855719590377422859]',
        authorUrl: 'https://dev.ivanfx.xyz/',
        downloadURL: 'https://dev.ivanfx.xyz/',
    },

    subtitle(data) {
        const actions = ["Connect", "Find Data", "Insert Data", "Update Data", "Delete Data"];
        return `MongoDB - ${actions[parseInt(data.action)]}`;
    },

    variableStorage(data, varType) {
        const type = parseInt(data.storage);
        if (type !== varType) return;
        return ([data.varName, 'Object']);
    },

    fields: ["action", "uri", "collection", "query", "data", "storage", "varName"],

    html(isEvent, data) {
        return `
        <div style="width: 100%; padding-top: 8px;">
            <span class="dbminputlabel">Action</span><br>
            <select id="action" class="round" onchange="glob.onActionChange(this)">
                <option value="0">Connect to Database</option>
                <option value="1">Find Data</option>
                <option value="2">Insert Data</option>
                <option value="3">Update Data</option>
                <option value="4">Delete Data</option>
            </select>
        </div>
        <br>
        <div id="uriDiv" style="width: 100%;">
            <span class="dbminputlabel">MongoDB URI (from MongoDB Atlas)</span><br>
            <input id="uri" class="round" type="text" placeholder="mongodb+srv://username:password@cluster.mongodb.net/database">
        </div>
        <br>
        <div id="collectionDiv" style="width: 100%;">
            <span class="dbminputlabel">Collection Name</span><br>
            <input id="collection" class="round" type="text" placeholder="mycollection">
        </div>
        <br>
        <div id="queryDiv" style="width: 100%;">
            <span class="dbminputlabel">Query (JSON)</span><br>
            <textarea id="query" class="round" rows="3" placeholder='{ "name": "John" }'></textarea>
        </div>
        <br>
        <div id="dataDiv" style="width: 100%;">
            <span class="dbminputlabel">Data (JSON)</span><br>
            <textarea id="data" class="round" rows="3" placeholder='{ "name": "John", "age": 30 }'></textarea>
        </div>
        <br>
        <div id="storageDiv" style="display: none; width: 100%;">
            <div style="float: left; width: 35%;">
                <span class="dbminputlabel">Store Result In</span><br>
                <select id="storage" class="round">
                    ${data.variables[1]}
                </select>
            </div>
            <div style="float: right; width: 60%;">
                <span class="dbminputlabel">Variable Name</span><br>
                <input id="varName" class="round" type="text">
            </div>
        </div>`;
    },

    init() {
        const { glob, document } = this;

        glob.onActionChange = function(event) {
            const value = parseInt(event.value);
            const [uriDiv, queryDiv, dataDiv, storageDiv] = ["uriDiv", "queryDiv", "dataDiv", "storageDiv"].map(id => document.getElementById(id));
            
            uriDiv.style.display = value === 0 ? "" : "none";
            queryDiv.style.display = value >= 1 ? "" : "none";
            dataDiv.style.display = [2, 3].includes(value) ? "" : "none";
            storageDiv.style.display = value === 1 ? "" : "none";
        };

        glob.onActionChange(document.getElementById("action"));
    },

    async action(cache) {
        const data = cache.actions[cache.index];
        const action = parseInt(data.action);
        const { MongoClient } = require('mongodb');
        const Bot = this.getDBM().Bot;

        try {
            switch(action) {
                case 0: // Connect
                    let uri = this.evalMessage(data.uri, cache);
                    if (!Bot.mongo) {
                        Bot.mongo = await MongoClient.connect(uri);
                        await Bot.mongo.db().command({ ping: 1 });
                        console.log('Successfully connected to MongoDB Atlas!');
                    }
                    break;

                case 1: // Find
                    if (!Bot.mongo) return console.error('Not connected to MongoDB!');
                    const collection1 = Bot.mongo.db().collection(this.evalMessage(data.collection, cache));
                    let query = {};
                    try {
                        const queryText = this.evalMessage(data.query, cache);
                        if (queryText && queryText.trim()) {
                            query = JSON.parse(queryText);
                        }
                    } catch (e) {
                        console.error('Invalid Query JSON:', e);
                        return;
                    }
                    const result = await collection1.find(query).toArray();
                    const storage = parseInt(data.storage);
                    const varName = this.evalMessage(data.varName, cache);
                    this.storeValue(result, storage, varName, cache);
                    break;

                case 2: // Insert
                    if (!Bot.mongo) return console.error('Not connected to MongoDB!');
                    const collection2 = Bot.mongo.db().collection(this.evalMessage(data.collection, cache));
                    const insertData = JSON.parse(this.evalMessage(data.data, cache));
                    await collection2.insertOne(insertData);
                    break;

                case 3: // Update
                    if (!Bot.mongo) return console.error('Not connected to MongoDB!');
                    const collection3 = Bot.mongo.db().collection(this.evalMessage(data.collection, cache));
                    const query3 = JSON.parse(this.evalMessage(data.query, cache));
                    const updateData = JSON.parse(this.evalMessage(data.data, cache));
                    await collection3.updateOne(query3, { $set: updateData });
                    break;

                case 4: // Delete
                    if (!Bot.mongo) return console.error('Not connected to MongoDB!');
                    const collection4 = Bot.mongo.db().collection(this.evalMessage(data.collection, cache));
                    const query4 = JSON.parse(this.evalMessage(data.query, cache));
                    await collection4.deleteOne(query4);
                    break;
            }
        } catch (err) {
            console.error('MongoDB Error:', err);
        }

        this.callNextAction(cache);
    },

    mod() {}
};