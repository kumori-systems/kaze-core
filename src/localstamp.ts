import * as child from 'child_process';

export class LocalStamp {

  private saasdk: child.ChildProcess = undefined;
  
  public start() {
    this._runInSaasdk('start');
  }

  public stop() {
    this._runInSaasdk('stop');
  }

  public restart() {
    this._runInSaasdk('restart');
  }

  public ssh() {
    this._runInSaasdk('ssh');
  }

  public status() {
    this._runInSaasdk('status');
  }

  private _runInSaasdk (action: string, params?: string[]) {
    if (this.saasdk != undefined) {
      console.log("LocalStamp is busy");
    } else {
      let args: string[] = [action];
      if ((params != undefined) && (params.length > 0)) {
        for (let param of params) {
          args.push(param);
        }
      }
      this.saasdk = child.spawn('saasdk', args, {
        stdio: 'inherit'
      });
    }
  }
  
}