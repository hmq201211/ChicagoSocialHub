import { Component, ViewEncapsulation, OnInit, OnChanges, Optional } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import { PlacesService } from 'src/app/places.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
export interface Status {
    time: Date;
    docks: number;
}
export interface Option {
    value: string;
}

@Component({
    selector: 'app-line-chart',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.css']
})

export class LineChartComponent implements OnInit {
    private title = 'Line Chart';    
    private margin = {top: 20, right: 20, bottom: 30, left: 50};
    private width: number;
    private height: number;
    private x: any;
    private y: any;
    private svg: any;
    private line: d3Shape.Line<[number, number]>;
    private id: any;

    private allStatuses: Status[];
    private RealTimeID;
   

    private options : Option[] = [ { value: 'past hour'},{ value: 'past day'},{ value: 'past week'},{ value: 'past month'}];
    private selected: Option = {value:'past hour'};
    

    constructor(private placeService:PlacesService, private route: ActivatedRoute, private location: Location,private router:Router) {

        this.width = 900 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
    }


    ngOnInit() {//fetch the divvy station id  
        
        this.id = +this.route.snapshot.paramMap.get('id');
        console.log(this.id) ;
        this.drawRealChart();
    }
    drawRealChart(){// wait for the change of divvy station logs and draw real time chart      

        this.clearTime();
        this.placeService.findStations_logs(this.id)
                .subscribe(
                    logs => { 
                       
                                if(this.svg)
                                this.svg.remove();   
                                this.allStatuses = this.ToTimeStemp(logs);
                                this.initSvg();
                                this.initAxis(this.selected); 
                                    }                           
                            
                        );
        this.RealTimeID = setInterval(() => this.placeService.findStations_logs(this.id) .subscribe(
            logs => { 
               
                        if(this.svg)
                        this.svg.remove();   
                        this.allStatuses = this.ToTimeStemp(logs);
                        this.initSvg();
                        this.initAxis(this.selected); 
                            }                           
                    
                ), 120000);
    }

    goBack(): void {//back function
        
        this.clearTime();
        this.location.back();
    }
    goHome(): void {//back function
        
        this.clearTime();
        this.router.navigate(['/']);
    }
    onchange(selectedValue: any) {// on select function

        let choosenOption = this.options.find(i => i.value == selectedValue);
        this.selected.value = choosenOption.value;
        this.drawRealChart();
        
    }
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
    filterPastHour(statuses:Status[]):Status[]{// filter the past hour time

        var result: Status[] = [];
        statuses.forEach(element => {
         if((new Date()).getTime() - element.time.getTime() <=1000*60*60){
             result.push(element);
         }  
     });
         return result;
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
    filterPastWeek(statuses:Status[]):Status[]{// filter the past week time

        var result: Status[] = [];
        statuses.forEach(element => {
         if((new Date()).getTime() - element.time.getTime() <=1000*60*60*24*7){
             result.push(element);
         }  
     });
         return result;
    }
    filterPastMonth(statuses:Status[]):Status[]{// filter the past week time

        var result: Status[] = [];
        statuses.forEach(element => {
         if((new Date()).getTime() - element.time.getTime() <=1000*60*60*24*7*30){
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
    private initAxis(option:Option) {
        
        var temp : Status[] = [];
        var final : Status[] = [];
              
            if (option.value=='past hour'){
                final = this.filterPastHour(this.allStatuses);
            }else if (option.value=='past day'){
                final = this.filterPastDay(this.allStatuses);
            }else if (option.value=='past week'){
                final = this.filterPastWeek(this.allStatuses);
            }else if (option.value=='past month'){
                final = this.filterPastMonth(this.allStatuses);
            }
            console.log(option.value,final);
           
        this.x = d3Scale.scaleTime().range([0, this.width]);
        this.y = d3Scale.scaleLinear().range([this.height, 0]);
        this.x.domain(d3Array.extent(final, (d) => d.time));
        this.y.domain(d3Array.extent(final, (d) => d.docks));
        this.drawAxis();
        this.drawLine(final)
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
