import { Http } from '@angular/http';
import { RequestOptionsArgs } from '@angular/http/src/interfaces';
import { URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';

import { LocalDataSource } from '../local/local.data-source';
import { ServerSourceConf } from './server-source.conf';
import { getDeepFromObject } from '../../helpers';

import 'rxjs/add/operator/toPromise';

export class ServerDataSource extends LocalDataSource {

  protected conf: ServerSourceConf;
  protected lastRequestCount: number = 0;
  protected extras: any;
  protected showLoader = false;
  constructor(protected http: Http, conf: ServerSourceConf | {} = {}) {
    super();

    this.conf = new ServerSourceConf(conf);

    if (!this.conf.endPoint) {
      throw new Error('At least endPoint must be specified as a configuration of the server data source.');
    }
  }

  count(): number {
    return this.lastRequestCount;
  }

  showloader(): boolean {
    return !this.showLoader;
  }

  getAllCustomResponseData(){
    return this.extras;
  }

  getElements(): Promise<any> {
    return this.requestElements().map(res => {
      this.lastRequestCount = this.extractTotalFromResponse(res);
      this.data = this.extractDataFromResponse(res);
      return this.data;
    }).toPromise();
  }

  /**
   * Extracts array of data from server response
   * @param res
   * @returns {any}
   */
  protected extractDataFromResponse(res: any): Array<any> {
    const rawData = res.json();
    if("data" in rawData && "extras" in rawData.data){
      this.extras = rawData.data.extras;
    }
    const data = !!this.conf.dataKey ? getDeepFromObject(rawData, this.conf.dataKey, []) : rawData;

    if (data instanceof Array) {
      return data;
    }

    throw new Error(`Data must be an array.
    Please check that data extracted from the server response by the key '${this.conf.dataKey}' exists and is array.`);
  }

  /**
   * Extracts total rows count from the server response
   * Looks for the count in the heders first, then in the response body
   * @param res
   * @returns {any}
   */
  protected extractTotalFromResponse(res: any): number {
    setTimeout(() => this.showLoader = false, 0);
    if (res.headers.has(this.conf.totalKey)) {
      return +res.headers.get(this.conf.totalKey);
    } else {
      const rawData = res.json();
      return getDeepFromObject(rawData, this.conf.totalKey, 0);
    }
  }

  protected requestElements(): Observable<any> {
    return this.http.get(this.conf.endPoint, this.createRequestOptions());
  }

  protected createRequestOptions( isReport = 0 ,fname = '' , extrafilters = '' ): RequestOptionsArgs {
    let requestOptions: RequestOptionsArgs = {};
    requestOptions.params = new URLSearchParams();

    requestOptions = this.addSortRequestOptions(requestOptions);
    requestOptions = this.addFilterRequestOptions(requestOptions);
    setTimeout(() => this.showLoader = true, 0);
    return this.addPagerRequestOptions(requestOptions , isReport , fname , extrafilters);
  }

  protected addSortRequestOptions(requestOptions: RequestOptionsArgs): RequestOptionsArgs {
    const searchParams: URLSearchParams = <URLSearchParams>requestOptions.params;

    if (this.sortConf) {
      this.sortConf.forEach((fieldConf) => {
        searchParams.set(this.conf.sortFieldKey, fieldConf.field);
        searchParams.set(this.conf.sortDirKey, fieldConf.direction.toUpperCase());
      });
    }

    return requestOptions;
  }

  protected addFilterRequestOptions(requestOptions: RequestOptionsArgs): RequestOptionsArgs {
    const searchParams: URLSearchParams = <URLSearchParams>requestOptions.params;

    if (this.filterConf.filters) {
      this.filterConf.filters.forEach((fieldConf: any) => {
        if (fieldConf['search']) {
          searchParams.set(this.conf.filterFieldKey.replace('#field#', fieldConf['field']), fieldConf['search']);
        }
      });
    }

    return requestOptions;
  }

  protected addPagerRequestOptions(requestOptions: RequestOptionsArgs , isReport = 0 , fname = '' , extrafilters = ''): RequestOptionsArgs {
    const searchParams: URLSearchParams = <URLSearchParams>requestOptions.params;

    if (this.pagingConf && this.pagingConf['page'] && this.pagingConf['perPage'] && isReport == 0 ) {
      searchParams.set(this.conf.pagerPageKey, this.pagingConf['page']);
      searchParams.set(this.conf.pagerLimitKey, this.pagingConf['perPage']);
    }

    if( isReport == 1 ){
      var count: string|number  = ""+9999999;
      var adminInfoObject = JSON.parse(localStorage.getItem("currentUser"));
      searchParams.set("export", "true");
      searchParams.set("emailId", adminInfoObject.email);
      searchParams.set("fname", fname);
      searchParams.set("count", count  );
      var extrafiltersJson = JSON.parse(extrafilters);
      if( ("fromDate" in extrafiltersJson) && ("toDate" in extrafiltersJson) && extrafiltersJson.fromDate != '' && extrafiltersJson.toDate != '' ){
        let dateFilter = extrafiltersJson.fromDate;
        if (extrafiltersJson.toDate) {
          dateFilter += '||' + extrafiltersJson.toDate;
        }
        searchParams.set("created_on", dateFilter);
      }
    }

    return requestOptions;
  }


  // call api to export data for report generation
  callApiToExportData( dataSet:any ): Observable<any> {
    console.log(dataSet.url)
    return this.http.get(dataSet.url , this.createRequestOptions(1 , dataSet.fname , JSON.stringify(dataSet)));
  }
}
