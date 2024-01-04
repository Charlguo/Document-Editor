// backend code
const mongoose = require('mongoose')

const Document = require('./Document')

const defaultValue = ""

mongoose.connect("mongodb://localhost:27017/google-docs-clone", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const io = require('socket.io')(3007,{
cors:{
    origin:"http://localhost:3000",
    methods:['GET','POST']
    }

})

io.on('connection',(socket) => {
    console.log(socket + "connected")

    socket.on('get-document',async documentId => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId)
        socket.emit('load-document',document.data)

        socket.on('send-changes',(delta) => {
            socket.broadcast.to(documentId).emit('receive-changes', delta)
        })

        socket.on('save-document',async data =>{
            await Document.findByIdAndUpdate(documentId,{data})
        })

    });

    socket.on('disconnect',() => {
        console.log("Client disconnected")
    })
})

async function findOrCreateDocument(id){
    if (id == null) return

    const document = await Document.findById(id);
    if (document) return document

    return await Document.create({
        _id:id,
        data:defaultValue
    })
}