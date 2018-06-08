/**
 * https://webpack.js.org/contribute/writing-a-plugin/
 */
/**
     * All hoks are mentioned @ https://webpack.js.org/api/compiler-hooks/
     */
const fs=require('fs');
const JSON = require('circular-json');
const cwd = __dirname;
const jsonFileName = 'apple.json';
var json;
if (!fs.existsSync(cwd+'/'+jsonFileName)) {
    console.log(" No such file re");
    fs.writeFileSync(cwd+'/'+jsonFileName,{});
    json={};
}
else{
    try{
        json = require(cwd+'/'+jsonFileName);
    }catch(e){
        json={}
    }
}


class Versioning{
    apply(compiler){
        compiler.plugin("make",this.make);
        compiler.plugin('emit',this.emit);
        compiler.plugin("done",this.done);
    }
    make(compilation,callback){

        callback();
        
    }
    emit(compilation,callback){
        process(compilation);
        callback();        
    }
    
    done(stats){
        for(let i in json){
            let bundle = json[i];
            let dir = cwd+'/'+bundle.currentVersion;
            //Step 1 does the folder exist
            if(!fs.existsSync(dir)){
                //Create version directory here
                fs.mkdirSync(dir);
            }
            moveFile(cwd+'/'+bundle.fileName,dir+'/'+bundle.fileName)
            //Step 2 does the file exist there
           // if(!fs.existsSync(dir+'/'+bundle.fileName)){
                //Create version directory here
                //console.log("HEY file ",bundle.fileName," does not exist in ",bundle.currentVersion);
                
                //console.log(fs.existsSync(cwd+'/'+bundle.fileName));
            //}
        }
        /**
         * For each asset in json check if:
         * 1. folder with version exists
         * 2. In that folder this file exists
         * 3. NOT then create the folder and put the file there
         */
    }
}
function process(compilation){
        var w = json;
        var recordsArray = Object.entries(compilation.records.chunks.byName);
        var assetsNames = Object.keys(compilation.assets);
        compilation.compiler.outputPath = cwd;
        recordsArray.forEach(function(asset){
            let bundle = asset[0];
            let hash = compilation.namedChunks[bundle].renderedHash;
            let count = 0;
            let length;
            
            let fileName = assetsNames.find(function(name,index,arr){
                if(name.match(bundle)) {
                    arr.splice(index,1);
                    return name;
                }
            }) || '';
            if(fileName.match(/\.js/gi)){
                //Handle JS here
            }
            if(w[bundle] && w[bundle].hashes){
                w[bundle].latestBuild = fileName+'?v='+hash;
                if(w[bundle].hashes.find(function(item){
                    w[bundle].currentVersion = item.version;
                    return item.hash==hash?item.version:'';}))
                {return;}
                let key = 'v'+Number(w[bundle].hashes.length+1);
                let o = {};
                o.version = key;
                w[bundle].currentVersion = key;
                o.hash = hash;
                o.link = fileName+'?v='+hash;
                w[bundle].hashes.push(o);
            }
            else{
                
                w[bundle]={
                    fileName:fileName,
                    latestBuild:fileName+'?v='+hash,
                    currentVersion:'v1',
                    hashes:[{
                        version:'v1',
                        hash:hash,
                        link:fileName+'?v='+hash
                    }]
                }
            }
        });
        fs.writeFile(cwd+"/"+jsonFileName,JSON.stringify(w, null, 1));
        //fs.writeFile(cwd+"/compiler.json",JSON.stringify(compilation.assets, null, 1));
        
    }

function parseObj(obj,depth){
    let o = {};
    if(!obj) return "";
    if(depth==3) return obj;
    if(typeof obj == "string" || typeof obj == "array" || typeof obj == "boolean" || typeof obj == "function") return obj;
    if(typeof obj=="object"){
        Object.keys(obj).map((el,index)=>{
            if(obj[el]){
                o[el] = parseObj(obj[el],depth+1);
            }
        })
    }
    //console.log("Finality is ",o);
    // fs.writeFileSync("config/versions.json",JSON.stringify(o));
    // fs.writeFile('config/versioning.json',JSON.stringify(o),'utf-8',(err)=>{
    //     console.log('caught error',err);
    // })
    return o;
}
function moveFile(oldPath, newPath, callback) {

    function copy_and_delete () {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);
        readStream.on('close', 
              function () {
                fs.unlink(oldPath, callback);
              }
        );

        readStream.pipe(writeStream);
    }

    fs.rename(oldPath, newPath, 
        function (err) {
          if (err) {
              if (err.code === 'EXDEV') {
                  copy_and_delete();
              } else {
                  callback(err);
              }
              return;// << both cases (err/copy_and_delete)
          }
          callback();
        }
    );
}

module.exports = Versioning;