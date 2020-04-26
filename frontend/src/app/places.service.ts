

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { HttpHeaders } from '@angular/common/http';



import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';


import { Place } from './place';





const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json'
  })
};


@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  findPlacesByZipCode(zipcode: any): any {
   const find_places_at = {
      zipcode:zipcode
    };

    return this.http.post(`${this.uri}/places/zipcode`, find_places_at, httpOptions);
  }

  uri = 'http://localhost:4000';

  constructor(private http: HttpClient) {


  }



  getPlaces() : Observable<Place[]> {
    return this.http.get<Place[]>(`${this.uri}/places`);
  }

  getAllPlaces() : Observable<Place[]> {
    return this.http.get<Place[]>(`${this.uri}/all_places`);
  }


  getPlaceSelected() {
    return this.http.get(`${this.uri}/place_selected`);
  }


  getStations() {
    return this.http.get(`${this.uri}/stations`);
  }



  findPlaces(find, where) {
    const find_places_at = {
      find: find,
      where: where
    };

    return this.http.post(`${this.uri}/places/find`, find_places_at, httpOptions);

  }




  findStations(placeName) {
    const find_stations_at = {
      placeName: placeName
    };

    var str = JSON.stringify(find_stations_at, null, 2);


    return this.http.post(`${this.uri}/stations/find`, find_stations_at, httpOptions);

  }


  findStations_logs(id) {
    const find_stations_at = {
      id: id
    };
    var str = JSON.stringify(find_stations_at, null, 2);
    var result =   this.http.post(`${this.uri}/stations/logs`, find_stations_at, httpOptions);
    return result;

  }



}
