import { gapi } from 'gapi-script';

const CLIENT_ID = '427190510272-8ga7f7o11l7a1bia4ug7ti8v4umvdh02.apps.googleusercontent.com';

export const initGoogleAPI = () => {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      clientId: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
    });
  });
};
