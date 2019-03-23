version = 0.97;

$(document).ready(
    function() {
        $('#header p').text('Version '+version);

        $('input#engine_generate').click(function() {
            var name = $('#ac_enginename').val();
            var type = $('input[name=ac_enginetype]:checked').val();
            var power = Number($('#ac_enginepower').val());
            var units = $('input[name=ac_engineunits]:checked').val();
            var augmented = $('#ac_augmented').prop('checked');
            var injected = $('#ac_injected').prop('checked');

            // Convert kilowatts to horsepower
            if (units == 1)
                power *= 1.341;

            // Convert newtons to pound
            if (units == 3)
                power *= 0.2248;

            var comments = '<--\n  File:     '+name+'.xml\n  Author:   Aero-Matic v '+version+'\n\n  Inputs\n    name:           '+name+'\n    type:           ';

            if (type == 0) {
                comments += 'piston'
                var engine = $('<piston_engine/>');
                var minmp = $('<minmp>');
                minmp.attr('unit', 'INHG');
                minmp.text('10.0');
                engine.append(minmp);
            }
            else if (type == 1)
                var engine = $('<turbine_engine/>');
            else if (type == 2)
                var engine = $('<turbine_engine/>');
            else if (type == 3)
                var engine = $('<rocket_engine/>');

            engine.attr('name', name);

            var XML = $('<XMLDocument/>');
            comments +='\n    power:          '+power;
            switch(units) {
                case 0:
                case 2:
                    comments += 'hp';
                    break;
                case 1:
                case 3:
                    comments += 'lb';
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
            document.getElementById('download-link').click();
        });
    });
