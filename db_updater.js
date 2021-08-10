const { google } = require('googleapis');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const date = require('date-and-time');
const today = date.format(new Date(), 'YYYY-MM-DD');
require('dotenv').config();

let drive = {};
const buff = Buffer.from(process.env.PRIVATE_KEY, "base64");
process.env.PRIVATE_KEY = buff.toString('ascii');


  const main = async () => {
    const jwtClient = new google.auth.JWT(
      process.env.CLIENT_EMAIL,
      null,
      process.env.PRIVATE_KEY,
      ["https://www.googleapis.com/auth/drive"],
    );
        
    await jwtClient.authorize();
    drive = google.drive({ version: "v3", auth:jwtClient });
    createFile();

  }

  const createFile = async () => {
    const command = `cd ${process.env.BACKUP_DIR} &&
      mongodump --host ${process.env.MONGO_HOST} --port ${process.env.MONGO_PORT} --db ${process.env.MONGO_DB} --authenticationDatabase admin --username ${process.env.MONGO_USER} --password "${process.env.MONGO_PASSWORD}"  --out db_backup &&
      tar czf ${today}.tar.gz db_backup &&
      gpg -e -r ${process.env.USERNAME} ${today}.tar.gz &&
      rm -rf db_backup &&
      rm ${today}.tar.gz`;

    await exec(command);
    uploadFile();
  }

  const uploadFile = () => {
    drive.files.create({
        resource: { 'name': `${today}.tar.gz.gpg` },
        media: { mimeType: 'application/gzip', body: fs.createReadStream(`./${today}.tar.gz.gpg`) },
      }, function (err) {
        if (err) {
          console.error(err);
        }
        console.log('Complete, exiting.');
        return process.exit(0);
      });
  }

  main();

