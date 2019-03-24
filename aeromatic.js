version = 0.97;

$(document).ready(
    function() {
        $('#header p').text('Version '+version);

        $('input#engine_generate').click(function() {
            var name = $('#ac_enginename').val();
            var type = Number($('input[name=ac_enginetype]:checked').val());
            var power = Number($('#ac_enginepower').val());
            var units = Number($('input[name=ac_engineunits]:checked').val());
            var augmented = $('#ac_augmented').prop('checked');
            var injected = $('#ac_injected').prop('checked');

            // Convert kilowatts to horsepower
            if (units == 1)
                power *= 1.341;

            // Convert newtons to pound
            if (units == 3)
                power *= 0.2248;

            var comments = '<--\n  File:     '+name+'.xml\n  Author:   Aero-Matic v '+version+'\n\n  Inputs\n    name:           '+name+'\n    type:           ';
            var engine;

            switch(type) {
                case 0:
                    comments += 'piston'
                    engine = MakePiston(power);
                    break;
                case 1:
                    engine = $('<turbine_engine/>');
                    break;
                case 2:
                    engine = $('<turbine_engine/>');
                    break;
                case 3:
                    engine = $('<rocket_engine/>');
                    break;
            }

            engine.attr('name', name);

            var XML = $('<XMLDocument/>');
            comments +='\n    power:          '+power;
            switch(units) {
                case 0:
                case 2:
                    comments += ' hp';
                    break;
                case 1:
                case 3:
                    comments += ' lb';
                    break;
            }

            comments += '\n    augmented?      ';

            if (augmented)
                comments += 'yes';
            else
                comments += 'no';

                comments += '\n    injected?       ';

                if (injected)
                    comments += 'yes';
                else
                    comments += 'no';
    
            XML.append(comments+'\n-->\n')
            XML.append(engine);

            console.log("Engine name: "+name+"\nEngine type: "+type+"\nEngine power: "+power+"\nEngine units: "+units+"\nAugmented: "+augmented+"\nInjected: "+injected);
            console.log(XML.html());
            
            // Trigger the engine XML file download
            var blob = new Blob(['<?xml version=\"1.0\"?>\n', XML.html()], {type: 'text/xml'});
            var url = URL.createObjectURL(blob);
            var link = $('#download-link');
            link.attr('href', url);
            link.attr('download', 'engine2.php');
            //document.getElementById('download-link').click();
        });
    });

function MakePiston(power) {
    var engine = $('<piston_engine/>');
    add_tag(engine, 'minmp', '10.0', 'INHG');
    add_tag(engine, 'maxmp', '28.5', 'INHG');

    var displ = power * 1.9;
    add_tag(engine, 'displacement', displ.toFixed(2), 'IN3');
    add_tag(engine, 'maxhp', power.toFixed(2));
     add_tag(engine, 'cycles', 4);
    add_tag(engine, 'idlerpm', 700);
    add_tag(engine, 'maxrpm', 2800);
    add_tag(engine, 'sparkfaildrop', 0.1);
    add_tag(engine, 'volumetric-efficiency', 0.85);
    add_tag(engine, 'man-press-lag', 0.1);
    add_tag(engine, 'static-friction', (power*0.005).toFixed(2), 'HP');
    add_tag(engine, 'starter-torque', (power*0.8).toFixed(2));
    add_tag(engine, 'starter-rpm', 1400);

    engine.append('<!-- Defining <bsfc> over-rides the built-in horsepower calculations -->');
    engine.append('<!--<bsfc>           0.45 </bsfc>-->');

    var stroke = 4.375; // FIXME: we can use maxrpm to find a stroke length
    var bore = 5.125;
    var bore_s = Math.pow(bore/2, 2.0) * 3.14159; // Guess the area of one piston (5.125/2)^2 * PI
    var n_cylinders = displ / (stroke * bore_s);
    if (n_cylinders < 1)
        n_cylinders = 1;
    else
        n_cylinders = Math.floor(n_cylinders+0.5);

    add_tag(engine, 'stroke', stroke.toFixed(3), 'IN');
    add_tag(engine, 'bore',bore.toFixed(3), 'IN');
    add_tag(engine, 'cylinders', n_cylinders.toFixed(1));
    add_tag(engine, 'compression-ratio', 8.0);

    return engine;
}

function add_tag(engine, name, value, unit=null) {
    var tag = $('<'+name+'>');
    if (unit)
        tag.attr('unit', unit);
    tag.text(value);
    engine.append(tag);
}
