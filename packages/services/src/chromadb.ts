import { ChromaClient } from 'chromadb';

const client = new ChromaClient({
    path: "http://ovps.chadasaniya.in:7468"
})

export default client;
