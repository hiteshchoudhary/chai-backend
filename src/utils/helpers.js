import fs from "fs";

export const deleteLocalImage = (...localPaths) => {
    localPaths.forEach(localPath => {
        if(!(localPath?.trim() === "" || localPath === undefined || localPath === null)){
            fs.unlinkSync(localPath);
        }
    })
}
