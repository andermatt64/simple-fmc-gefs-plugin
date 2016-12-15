/*
 * Implements a fix for bad runway terrain at certain airports
 */

 var TerrainFix = {
   _oldTerrainProvider: null,
   _ellipseProvider: new Cesium.EllipsoidTerrainProvider(),

   init: function () {
     TerrainFix._oldTerrainProvider = gefs.api.viewer.terrainProvider;
     SimpleFMC.registerUpdate(TerrainFix.update);
   },

   update: function () {
     var airportFix = ["HKG", "PEK", "PVG", "SIN", "SCL", "AKL", "CPT"];
     for (var i = 0; i < airportFix.length; i++) {
       var key = LOCATION_DB.airports[airportFix[i]];
       if (key !== undefined) {
         var current = {
           lat: gefs.aircraft.llaLocation[0],
           lon: gefs.aircraft.llaLocation[1]
         };

         var distance = Utils.getGreatCircleDistance(current, key);
         var altitude = gefs.aircraft.animationValue.altitude - (gefs.groundElevation * AGLStatus.metersToFeet) - AGLStatus._planeHeight;

         if (distance < 5 && altitude < 1500) {
           if (TerrainFix._ellipseProvider !== gefs.api.viewer.terrainProvider) {
             gefs.api.viewer.terrainProvider = TerrainFix._ellipseProvider;
           }
         } else {
           if (TerrainFix._oldTerrainProvider !== gefs.api.viewer.terrainProvider) {
             gefs.api.viewer.terrainProvider = TerrainFix._oldTerrainProvider;
           }
         }
       }
     }
   }
 };
