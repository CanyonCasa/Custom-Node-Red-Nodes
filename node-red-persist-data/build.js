// windows build command...

const nodeName = 'node-red-persist-data';   // change per specific node...
const cwd = process.cwd();
const home = process.env.HOMEPATH || process.env.HOME;

const fsp = require('fs').promises;
const package = require('./package.json');
const { exec } = require('child_process');


function command(cmd) {
    if (cmd.startsWith('sleep')){
        let sleep = cmd.split(' ')[1];
        return new Promise(rslv => setTimeout(rslv,sleep*1000));
    };
    if (cmd.startsWith('cd')) { // must be done internally for folloow on script command to use the change
        let cd = cmd.split(' ')[1];
        return new Promise(rslv =>{try { process.chdir(cd); rslv(false); } catch(e) {rslv(true);} });
    };
    return new Promise(resolve=>{
        exec(cmd,((error,stdout,stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                resolve(true);
            };
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                resolve(false);
            };
            console.log(`${cmd} => ${stdout}`);
            resolve(false);
        }))
    });
}

(async function build(){
    //update package version...
    let versionFields = package.version.split('.');
    versionFields[2] = +versionFields[2] + 1;
    let version = versionFields.join('.');
    console.log(`Bump version from ${package.version} to ${version}`)
    package.version = version;
    await fsp.writeFile('./package.json',JSON.stringify(package,null,4));

    let tgz = `C:\\data\\git\\Custom-Node-Red-Nodes\\${nodeName}\\canyoncasa-${nodeName}-${version}.tgz`
    console.log(`New archive: ${tgz}`)
    let commands = [
        'del *.tgz',
        'npm pack',
        `cd ${home}\\.node-red`,
        `npm install ${tgz}`,
        `cd ${cwd}`
    ];
    for (let cmd of commands) {
        console.log(`cmd: ${cmd}`)
        let result = await command(cmd);
        if (result) break;
    };

})()
.then(x=>process.exit(0))
.catch(e=>{console.error(e); process.exit(e.code)});