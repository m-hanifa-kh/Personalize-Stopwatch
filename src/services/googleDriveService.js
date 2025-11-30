import { gapi } from 'gapi-script';

export const uploadHistoryToDrive = async (history) => {
    try {
        const fileContent = JSON.stringify(history);
        const file = new Blob([fileContent], { type: 'application/json' });

        const metadata = {
            name: 'stopwatch-history.json',
            mimeType: 'application/json',
        };

        const accessToken = gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .getAuthResponse().access_token;

        const searchResponse = await fetch(
            "https://www.googleapis.com/drive/v3/files?q=name=\"stopwatch-history.json\" and trashed=false",
            {
                headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
            }
        );
        const searchData = await searchResponse.json();

        let url =
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
        let method = 'POST';

        if (searchData.files && searchData.files.length > 0) {
            const fileId = searchData.files[0].id;
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`;
            method = 'PATCH';
        }

        const form = new FormData();
        form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        form.append('file', file);

        await fetch(url, {
            method: method,
            headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
            body: form,
        });

        console.log('History uploaded to Drive!');
        return true;
    } catch (error) {
        console.error('Error uploading history:', error);
        throw error;
    }
};

export const downloadHistoryFromDrive = async () => {
    const accessToken = gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getAuthResponse().access_token;

    try {
        const response = await fetch(
            'https://www.googleapis.com/drive/v3/files?q=name="stopwatch-history.json" and trashed=false',
            {
                headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Drive API Error:', response.status, response.statusText, errorBody);
            throw new Error(`HTTP error! Status: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        const files = data.files;

        if (files.length === 0) {
            return { status: 'no_file' };
        }

        if (files.length === 1) {
            const downloadResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`,
                {
                    headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
                }
            );
            const fileContent = await downloadResponse.json();
            return { status: 'success', data: fileContent };
        }

        if (files.length === 2) {
            const downloadFile = async (file) => {
                const res = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                    {
                        headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
                    }
                );
                const content = await res.text();
                return { ...file, content };
            };

            const fullFile1 = await downloadFile(files[0]);
            const fullFile2 = await downloadFile(files[1]);

            return { status: 'conflict', files: [fullFile1, fullFile2] };
        }
    } catch (error) {
        console.error('Error fetching history from Drive:', error);
        throw error;
    }
};
