const multer = require("multer")
var storage=multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, 'uploads')



    },
    filename: function (req, file, cb) {

        var ext = file.originalname.substring(file.originalname.lastIndexOf('.'))
        cb(null,file.fieldname+'-'+Date.now()+ext)
    }

})


var upload=multer({storage:storage})


module.exports=multer(upload)