////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


/// This file and the source code provided can be used only for   
/// the projects and assignments of this course

/// Last Edit by Dr. Atef Bader: 1/30/2019


////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////




import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material';

import { Station } from '../../station';
import { PlacesService } from '../../places.service';


import { Input, ViewChild, NgZone} from '@angular/core';
import { MapsAPILoader, AgmMap } from '@agm/core';
import { GoogleMapsAPIWrapper } from '@agm/core/services';
import { Place } from 'src/app/place';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';




interface Location {
  lat: number;
  lng: number;
  zoom: number;
  address_level_1?:string;
  address_level_2?: string;
  address_country?: string;
  address_zip?: string;
  address_state?: string;
  label: string;
}
export interface Status {
  time: Date;
  docks: number;
}

@Component({
  selector: 'app-list-of-stations',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './list-of-stations.component.html',
  styleUrls: ['./list-of-stations.component.css']
})
export class ListOfStationsComponent implements OnInit {
  goBack(): void {
    this.clearTime();
    this.router.navigate(['/list_of_places']);
  }

goHome(): void {
  this.clearTime();
    this.router.navigate(['/']);
}
goHeatmap(): void{
  this.clearTime();
    this.router.navigate(['/heatmap']);
}
goLineChart(id): void{
  this.clearTime();
    this.router.navigate(['/linechart',id]);
}


  stations: Station[];
  markers: Station[];
  placeSelected: Place;

  displayedColumns = ['id', 'stationName', 'availableBikes', 'availableDocks', 'is_renting', 'lastCommunicationTime', 'latitude',  'longitude', 'status', 'totalDocks','linechart'];


  icon = {
    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    scaledSize: {
      width: 60,
      height: 60
    }
  }



  constructor(private placesService: PlacesService, private router: Router, private route: ActivatedRoute) { 
    this.width = 630 - this.margin.left - this.margin.right;
    this.height = 300 - this.margin.top - this.margin.bottom;
  }

  ngOnInit() {
    this.fetchStations();
    this.getPlaceSelected();

  }

  fetchStations() {
    this.placesService
      .getStations()
      .subscribe((data: Station[]) => {
        this.stations = data;
        this.markers = data;

      });
  }


  getPlaceSelected() {
    this.placesService
      .getPlaceSelected()
      .subscribe((data: Place) => {
        this.placeSelected = data;

      });
  }



clickedMarker(label: string, index: number,id :number) {
  console.log(id);
  console.log(`clicked the marker: ${label || index}`)
  if(label!= 'placeSelected'){
    this.clearTime();
    this.drawRealChart(id);
  }
}


circleRadius:number = 3000; // km

public location:Location = {
  lat: 41.882607,
  lng: -87.643548,
  label: 'You are Here',
  zoom: 13
};

private margin = {top: 20, right: 20, bottom: 30, left: 50};
private width: number;
private height: number;
private x: any;
private y: any;
private svg: any;
private line: d3Shape.Line<[number, number]>;
private allStatuses: Status[];
private RealTimeID;
clearTime(){// clear timer function

  if(this.RealTimeID){
      clearInterval(this.RealTimeID);
  }
} 
ToTimeStemp(logs: any): Status[] {// format time function

  var result: Status[] = []; 
  logs.forEach(element => {
      var thistime = new Date(element.lastCommunicationTime);
      var thisdocks = element.availableDocks;
      var temp:Status = { time:thistime, docks:thisdocks};
      result.push(temp);
  });
  return result;
}   
drawRealChart(id){// wait for the change of divvy station logs and draw real time chart      

  this.clearTime();
  this.placesService.findStations_logs(id)
          .subscribe(
              logs => 
                    
                      {   if(this.svg)
                          this.svg.remove();   
                          this.allStatuses = this.ToTimeStemp(logs);
                          var date = this.filterPastDay(this.allStatuses);
                          this.initSvg();
                          this.initAxis(date); 
                              })                            
                      
              ;
  this.RealTimeID = setInterval(() => this.placesService.findStations_logs(id).subscribe(
    logs => 
          
            {   if(this.svg)
                this.svg.remove();   
                this.allStatuses = this.ToTimeStemp(logs);
                var date = this.filterPastDay(this.allStatuses);
                this.initSvg();
                this.initAxis(date); 
                    })
  , 120000);
}
filterPastDay(statuses:Status[]):Status[]{// filter the past day time

  var result: Status[] = [];
  statuses.forEach(element => {
   if((new Date()).getTime() - element.time.getTime() <=1000*60*60*24){
       result.push(element);
   }  
});
   return result;
}
private initSvg() {      

  this.svg = d3.select('svg')
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
}
private initAxis(data: Status[]) {     
  this.x = d3Scale.scaleTime().range([0, this.width]);
  this.y = d3Scale.scaleLinear().range([this.height, 0]);
  this.x.domain(d3Array.extent(data, (d) => d.time));
  this.y.domain(d3Array.extent(data, (d) => d.docks));
  this.drawAxis();
  this.drawLine(data); 
}
private drawAxis() {

  this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3Axis.axisBottom(this.x));

  this.svg.append('g')
      .attr('class', 'axis axis--y')
      .call(d3Axis.axisLeft(this.y))
      .append('text')
      .attr('class', 'axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('available docks');
}
private drawLine(statues:Status[]) {        

  this.line = d3Shape.line()
      .x( (d: any) => this.x(d.time ))
      .y( (d: any) => this.y(d.docks));
      this.svg.append('path')
          .style('stroke','green')
          .style('stroke-width', 5)
          .datum(statues.sort(this.sortNumber))
          .attr('class', 'line')
          .attr('d', this.line);  
}
sortNumber(a,b)// sort function
{

  return a.time - b.time
}

}



