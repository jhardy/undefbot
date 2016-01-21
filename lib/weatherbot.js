
function weatherIconLookup( id ) {
   var icon = ":sunny;"
   switch ( true ) {
     case (id < 300):
        icon = ":thunder_cloud_and_rain:";
        break;
     case (id < 600):
       icon = ":rain_cloud:";
       break;
     case (id < 611):
       icon = ":showman:";
       break;
     case (id < 700):
       icon = ":snow_cloud:";
       break;
     case (id < 771):
       icon = ":fog:";
       break;
     case (id < 781):
       icon = ":wind_blowing_face:"
       break;
     case (id < 800):
       icon = ":tornado:"
       break;
     case (id < 801):
       icon = ":sunny:";
       break;
     case (id < 804):
       icon = ":mostly_sunny:"
       break;
     case (id < 900):
       icon = ":cloud:"
       break;
     case (id < 901):
       icon = ":tornado:";
       break;
     case (id < 903):
       icon = ":ocean:";
       break;
     case (id < 904):
       icon = ":snowflake:";
       break;
     case (id < 905):
       icon = ":fire:";
       break;
     case (id < 952):
       icon = ":sunny:";
       break;
     case (id < 960):
       icon = ":dash:";
       break;
     case (id < 1000):
       icon = ":tornado:";
       break;
  }

  return icon
}

module.exports = weatherIconLookup;
