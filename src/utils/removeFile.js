import fs from "fs";

export const removeFile = ({files}) => {
  
  if (!files) return;

  Object.values(files)
    .filter((file) => file.length > 0 && file[0].path)
    .forEach((file) => {
      const path = file[0].path;
      fs.unlinkSync(path);
    });
};
