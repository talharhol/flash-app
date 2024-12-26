import { FirebaseApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";

export class RemoteStorage {
    private storage: FirebaseStorage

    constructor(app: FirebaseApp) {
        this.storage = getStorage(app);

    }

    public async uploadFile(local: string, remote: string): Promise<string> {
        const response = await fetch(local);
        const blob = await response.blob();
      
        const storageRef = ref(this.storage, remote);
        await uploadBytes(storageRef, blob);
      
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    }
}
