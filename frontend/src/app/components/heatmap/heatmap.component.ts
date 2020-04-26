import { Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/places.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Place } from 'src/app/place';


export class Option {
  value:string;
}
@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css']
})
export class HeatmapComponent implements OnInit {
 private selectedDropDownOption :Option ={value:'pure rating'};
 private dropDownOptions: Option[] = [{value:'pure counting'},{value:'pure rating'},{value:'weighted rating'}]
 
 onDropDownchange(selectedValue: any) {

  let choosenOption = this.dropDownOptions.find(i => i.value == selectedValue);
  this.selectedDropDownOption.value = choosenOption.value;
  this.loadData(2);
  
}
 
  goBack(): void {
    this.location.back();
}

goHome(): void {
    this.router.navigate(['/']);
}
  
  constructor(private placeService:PlacesService, private route: ActivatedRoute, private location: Location,private router:Router) { }
  private data :google.maps.visualization.WeightedLocation[] = []
  private selectedPlace : Place;
  ngOnInit() {  
    
  }
  private map: google.maps.Map = null;
  private marker: google.maps.Marker = null;
  private heatmap: google.maps.visualization.HeatmapLayer = null;
  filterData(place:Place,option:Option){
    if(option.value=='pure count'){
      return place.review_count;
    }else if (option.value=='pure rating'){
      return place.rating;
    }else {
      return +place.rating*+place.review_count
    }
  }
  loadMarker(){
    this.placeService.getPlaceSelected().subscribe
              ((place:Place)=>
              {
                this.selectedPlace = place;
                this.marker = new google.maps.Marker({position:new google.maps.LatLng(+this.selectedPlace.latitude,+this.selectedPlace.longitude), title:'you selected here',map:this.map})
              });

  }  
  loadData(radius:number){
    this.data = [];
    this.placeService.getAllPlaces().subscribe
    (
      (data: Place[]) => 
          {  
              data.forEach(element => {
              if(Math.abs(+element.longitude - +this.selectedPlace.longitude)<=radius/1100 &&Math.abs(+element.latitude-+this.selectedPlace.latitude)<=radius/1100)
                {
                  var temp = new google.maps.LatLng(+element.latitude,+element.longitude);
                  var weight = this.filterData(element,this.selectedDropDownOption);
                  this.data.push({location:temp,weight:+weight})
                }      
              });              
              this.drawMap();
                         
        });    
    
  }
  drawMap(){
                this.map.setCenter({lat:+this.selectedPlace.latitude,lng:+this.selectedPlace.longitude});
                this.map.setZoom(17);
                console.log(this.data);
                if(this.heatmap){
                  this.heatmap.setMap(null);
                }                
                this.heatmap = new google.maps.visualization.HeatmapLayer({
                data: this.data,
                map: this.map,
                radius:50})
                ;    
  }
  onMapLoad(mapInstance: google.maps.Map) {
    this.map = mapInstance;
    this.loadMarker();
    this.loadData(2)
       
    
  }
}
