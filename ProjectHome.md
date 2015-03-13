A set of javascript classes for interfacing with digital ocean droplets etc.

```
// List all droplets, and shut each one down
var DO = new DigitalOcean(clientKey, apiKey);
DO.droplets.list(function(droplets) {
  for (var i = 0; i < droplets.length; i++) {
    console.log(droplets[i].name + ' ' + droplets[i].id + ' ' + droplets[i].status);
    DO.droplets.shutdown(droplets[i].id, function(event) {
      if (event.action_status) {
        console.log('completed status ' + event.action_status);
      } else if (event.percentage) {
        console.log('percent done ' + event.percentage + '%');
      }
    });
  }
});
```