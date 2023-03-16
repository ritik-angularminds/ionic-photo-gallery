import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';

  constructor() { }

  public async loadSaved() {
    const photosList = await Preferences.get({
      key: this.PHOTO_STORAGE
    });
    this.photos = JSON.parse(photosList.value) || [];

    for(let photo of this.photos) {
      const readFile = await Filesystem.readFile({
        path: photo.filePath,
        directory: Directory.Data
      });

      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`
    }
  }

  public async addNewToGallery() {
    // take a photo
    const capturedImage = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    const savedImage = await this.savePhoto(capturedImage);
    this.photos.unshift(savedImage);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  private async savePhoto(photo: Photo) {
    const base64Data = await this.readAsBase64(photo);
    const fileName = new Date().getTime() + '.jpeg';

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filePath: fileName,
      webviewPath: photo.webPath
    };
  }

  private async readAsBase64(photo: Photo) {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return await this.convertBlobToBase64(blob) as unknown as string;
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

export interface UserPhoto {
  filePath: string;
  webviewPath: string;
}
