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

            var comments = '<!--\n  File:     '+name+'.xml\n  Author:   Aero-Matic v '+version+'\n\n  Inputs\n    name:           '+name+'\n    type:           ';
            var engine;

            switch(type) {
                case 0:
                    comments += 'piston'
                    engine = MakePiston(power);
                    break;
                case 1:
                    engine = MakeTurbine(power, augmented, injected);
                    break;
                case 2:
                    engine = MakeTurboprop(power, units);
                    break;
                case 3:
                    engine = MakeRocket();
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

function MakeTurbine(power, augmented, injected) {
    engine = $('<turbine_engine/>');

    var maxthrust = augmented ? power*1.5 : power;
    add_tag(engine, 'milthrust', power.toFixed(1));
    if (augmented)
        add_tag(engine, 'maxthrust', maxthrust);
    add_tag(engine, 'bypassratio', 1.0);
    add_tag(engine, 'tsfc', 0.8);
    if (augmented)
        add_tag(engine, 'atsfc', 1.7);
    add_tag(engine, 'bleed', 0.03);
    add_tag(engine, 'idlen1', 30.0);
    add_tag(engine, 'idlen2', 60.0);
    add_tag(engine, 'maxn1', 100.0);
    add_tag(engine, 'maxn2', 100.0);
    if (augmented) {
        add_tag(engine, 'augmented', 1);
        add_tag(engine, 'augmethod', 1);
    }
    else
        add_tag(engine, 'augmented', 0);
    add_tag(engine, 'injected', injected ? 1 : 0);

    var idlethrust = make_table('IdleThrust',
    "    -10000     0     10000   20000   30000   40000   50000   60000\n"+
    "0.0  0.0430  0.0488  0.0528  0.0694  0.0899  0.1183  0.1467  0\n"+
    "0.2  0.0500  0.0501  0.0335  0.0544  0.0797  0.1049  0.1342  0\n"+
    "0.4  0.0040  0.0047  0.0020  0.0272  0.0595  0.0891  0.1203  0\n"+
    "0.6  0.0     0.0     0.0     0.0     0.0276  0.0718  0.1073  0\n"+
    "0.8  0.0     0.0     0.0     0.0     0.0474  0.0868  0.0900  0\n"+
    "1.0  0.0     0.0     0.0     0.0     0.0     0.0552  0.0800  0\n");
    engine.append(idlethrust);

    var milthrust = make_table('MilThrust',
    "     -10000       0   10000   20000   30000   40000   50000   60000\n"+
    "0.0   1.2600  1.0000  0.7400  0.5340  0.3720  0.2410  0.1490  0\n"+
    "0.2   1.1710  0.9340  0.6970  0.5060  0.3550  0.2310  0.1430  0\n"+
    "0.4   1.1500  0.9210  0.6920  0.5060  0.3570  0.2330  0.1450  0\n"+
    "0.6   1.1810  0.9510  0.7210  0.5320  0.3780  0.2480  0.1540  0\n"+
    "0.8   1.2580  1.0200  0.7820  0.5820  0.4170  0.2750  0.1700  0\n"+
    "1.0   1.3690  1.1200  0.8710  0.6510  0.4750  0.3150  0.1950  0\n"+
    "1.2   1.4850  1.2300  0.9750  0.7440  0.5450  0.3640  0.2250  0\n"+
    "1.4   1.5941  1.3400  1.0860  0.8450  0.6280  0.4240  0.2630  0\n");
    engine.append(milthrust);

    if (augmented) {
        var augthrust = make_table('AugThrust',
        "      -10000       0   10000   20000   30000   40000   50000   60000\n"+
        "0.0    1.1816  1.0000  0.8184  0.6627  0.5280  0.3756  0.2327  0\n"+
        "0.2    1.1308  0.9599  0.7890  0.6406  0.5116  0.3645  0.2258  0\n"+
        "0.4    1.1150  0.9474  0.7798  0.6340  0.5070  0.3615  0.2240  0\n"+
        "0.6    1.1284  0.9589  0.7894  0.6420  0.5134  0.3661  0.2268  0\n"+
        "0.8    1.1707  0.9942  0.8177  0.6647  0.5309  0.3784  0.2345  0\n"+
        "1.0    1.2411  1.0529  0.8648  0.7017  0.5596  0.3983  0.2467  0\n"+
        "1.2    1.3287  1.1254  0.9221  0.7462  0.5936  0.4219  0.2614  0\n"+
        "1.4    1.4365  1.2149  0.9933  0.8021  0.6360  0.4509  0.2794  0\n"+
        "1.6    1.5711  1.3260  1.0809  0.8700  0.6874  0.4860  0.3011  0\n"+
        "1.8    1.7301  1.4579  1.1857  0.9512  0.7495  0.5289  0.3277  0\n"+
        "2.0    1.8314  1.5700  1.3086  1.0474  0.8216  0.5786  0.3585  0\n"+
        "2.2    1.9700  1.6900  1.4100  1.2400  0.9100  0.6359  0.3940  0\n"+
        "2.4    2.0700  1.8000  1.5300  1.3400  1.0000  0.7200  0.4600  0\n"+
        "2.6    2.2000  1.9200  1.6400  1.4400  1.1000  0.8000  0.5200  0\n");
        engine.append(augthrust);
    }

    if (injected) {
        var inj = make_table('Injection',
        "       0       50000\n"+
        "0.0    1.2000  1.2000\n"+
        "1.0    1.2000  1.2000\n"
        );
        engine.append(inj);
    }

    return engine;
}

function MakeTurboprop(power, units) {
    var engine = $('<turbine_engine/>');

    // estimate thrust if given power
    if (units == 0 || units == 1)
        power *= 2.24;
        
    add_tag(engine, 'milthrust', power.toFixed(1));
    add_tag(engine, 'bypassratio', 0.0);
    add_tag(engine, 'tsfc', 0.55);
    add_tag(engine, 'bleed', 0.03);
    add_tag(engine, 'idlen1', 30.0);
    add_tag(engine, 'idlen2', 60.0);
    add_tag(engine, 'maxn1', 100.0);
    add_tag(engine, 'maxn2', 100.0);
    add_tag(engine, 'augmented', 0);
    add_tag(engine, 'injected', 0);

    var idlethrust = make_table('IdleThrust',
    "    -10000       0   10000   20000   30000   40000   50000\n"+
    "0.0  0.0430  0.0488  0.0528  0.0694  0.0899  0.1183  0.0\n"+
    "0.2  0.0500  0.0501  0.0335  0.0544  0.0797  0.1049  0.0\n"+
    "0.4  0.0040  0.0047  0.0020  0.0272  0.0595  0.0891  0.0\n"+
    "0.6  0.0     0.0     0.0     0.0276  0.0718  0.0430  0.0\n"+
    "0.8  0.0     0.0     0.0     0.0     0.0174  0.0086  0.0\n"+
    "1.0  0.0     0.0     0.0     0.0     0.0     0.0     0.0\n");
    engine.append(idlethrust);

    var milthrust = make_table('MilThrust',
    "    -10000       0   10000   20000   30000   40000   50000"+
    "0.0  1.1260  1.0000  0.7400  0.5340  0.3720  0.2410  0.0\n"+
    "0.2  1.1000  0.9340  0.6970  0.5060  0.3550  0.2310  0.0\n"+
    "0.4  1.0000  0.6410  0.6120  0.4060  0.3570  0.2330  0.0\n"+
    "0.6  0.4430  0.3510  0.2710  0.2020  0.1780  0.1020  0.0\n"+
    "0.8  0.0240  0.0200  0.0160  0.0130  0.0110  0.0100  0.0\n"+
    "1.0  0.0     0.0     0.0     0.0     0.0     0.0     0.0\n");
    engine.append(milthrust);

    return engine;
}

function MakeRocket() {
    var engine = $('<rocket_engine/>');
    add_tag(engine, 'shr', 1.23);
    add_tag(engine, 'max_pc', 86556);
    add_tag(engine, 'variance', 0.1);
    add_tag(engine, 'prop_eff', 0.67);
    add_tag(engine, 'maxthrottle', 1.0);
    add_tag(engine, 'minthrottle', 0.4);
    add_tag(engine, 'slfuelflowmax', 91.5);
    add_tag(engine, 'sloxiflowmax', 105.2);

    return engine;
}

function make_table(name, data) {
    var func = $('<function/>');
    func.attr('name', name);
    var table = $('<table/>');
    var row = $('<independentVar/>');
    row.attr('lookup', 'row');
    row.text('velocities/mach');
    var column = $('<independentVar/>');
    column.attr('lookup', 'column');
    column.text('atmosphere/density-altitude');
    var table_data = $('<tableData/>');
    table_data.text(data);

    table.append(row);
    table.append(column);
    table.append(table_data);
    func.append(table);

    return func;
}

function add_tag(engine, name, value, unit=null) {
    var tag = $('<'+name+'>');
    if (unit)
        tag.attr('unit', unit);
    tag.text(value);
    engine.append(tag);
}
