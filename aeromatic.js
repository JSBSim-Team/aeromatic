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
    
            var XML = $('<XMLDocument/>');
            XML.append(comments+'\n-->\n');
            XML.append(engine);

            console.log("Engine name: "+name+"\nEngine type: "+type+"\nEngine power: "+power+"\nEngine units: "+units+"\nAugmented: "+augmented+"\nInjected: "
                +injected);
            console.log(XML.html());
            
            // Trigger the engine XML file download
            var blob = new Blob(['<?xml version=\"1.0\"?>\n', XML.html()], {type: 'text/xml'});
            var url = URL.createObjectURL(blob);
            var link = $('#download-link');
            link.attr('href', url);
            link.attr('download', 'engine2.php');
            //document.getElementById('download-link').click();
        });

        $('input#prop_generate').click(function() {
            var power = Number($('#ac_enginepower2').val());
            var units = Number($('input[name=ac_engineunits2]:checked').val());
            var maxengrpm = Number($('#ac_maxengrpm').val());
            var pitch = Number($('input[name=ac_prop_pitch]:checked').val());
            var diameter = Number($('#ac_diameter').val());
            var diaunits = Number($('input[name=ac_diaunits]:checked').val());

            // Convert kilowatts to horsepower
            if (units == 1)
                power *= 1.341;

            switch(diaunits) {
                case 0:
                    break;
                case 1:
                    diameter /= 12;
                    break;
                case 2:
                    diameter *= 3.281;
                    break;
            }

            // find rpm which gives a tip Mach of 0.88
            // (static at sea level)
            var maxrpm = 18763.0 / diameter;
            var gearratio = maxengrpm / maxrpm;
            var max_rps = maxrpm / 60.0;
            var rps2 = max_rps * max_rps;
            var rps3 = max_rps * rps2;
            var d4 = diameter * diameter * diameter * diameter;
            var d5 = diameter * d4;
            var rho = 0.002378;

            // power and thrust coefficient at design point
            // for fixed pitch design point is beta=22, J=0.2
            // for variable pitch design point is beta=15, J=0
            var cp0 = power * 550 / rho /rps3 / d5;
            if (pitch == 0) {
                var ct0 = cp0 * 1.4;
                var rpss = Math.pow(power * 550 / 1.025 / cp0 / rho / d5, 0.3333);
                var static_thrust = 1.09 * ct0 * rho * rpss * rpss * d4;
            }
            else {
                ct0 = cp0 * 2.33;
                var static_thrust = ct0 * rho * rps2 * d4;
            }

            // estimate number of blades
            var blades = 3;
            if (cp0 < 0.035)
                blades = 2;
            else if (cp0 > 0.065)
                blades = 4;

            // estimate moment of inertia
            var weight = Math.pow(diameter, 2.8) / 4.8;
            var mass_prop = weight / 32.174;
            var mass_hub = 0.1 * mass_prop;
            var mass_blade = (0.9 * mass_prop) / blades;
            var L = diameter / 2; // length each blade (feet)
            var R = L * 0.1; // radius of hub (feet)
            var ixx_blades = blades * (0.33333 * mass_blade * L * L);
            var ixx_hub = 0.5 * mass_hub * R * R;
            var ixx = ixx_blades + ixx_hub;

            // Print XML file
            var comments = '<!-- Generated by Aero-Matic v '+version+'\n\n     Inputs:\n                horsepower: '+power.toFixed(1)
                +'\n                     pitch: ';
            if (pitch == 0)
                comments += 'fixed';
            else
                comments += 'variable';
            comments += '\n            max engine rpm: '+maxengrpm+'\n        prop diameter (ft): '+diameter+'\n\n    Outputs:\n              max prop rpm: '
                +maxrpm.toFixed(2)+'\n                gear ratio: '+gearratio.toFixed(2)+'\n                       Cp0: '+cp0.toFixed(6)
                +'\n                       Ct0: '+ct0.toFixed(6)+'\n       static thrust (lbs): '+static_thrust.toFixed(2);
     
            var XML = $('<XMLDocument/>');
            XML.append(comments+'\n-->\n\n');

            var propeller = $('<propeller/>');
            propeller.attr('version', '1.01');
            propeller.attr('name', 'prop');
            add_tag(propeller, 'ixx', ixx.toFixed(2));
            add_tag(propeller, 'diameter', diameter, 'IN');
            add_tag(propeller, 'numblades', blades);
            add_tag(propeller, 'gearratio', gearratio.toFixed(2));
            add_tag(propeller, 'cp_factor', 1.0);
            add_tag(propeller, 'ct_factor', 1.0);

            if (pitch == 1) {
                add_tag(propeller, 'minpitch', 12);
                add_tag(propeller, 'maxpitch', 45);
                add_tag(propeller, 'minrpm', (maxrpm*0.85).toFixed(0));
                add_tag(propeller, 'maxrpm', maxrpm.toFixed(0));
            }

            if (pitch == 0) {
                var thrust_table = make_internal_table('C_THRUST', [1.090, 1.045, 1.0, 0.92, 0.826, 0.728, 0.589, 0.447, 0.242, -0.082, -0.429, -0.772], ct0);
            }
            else {
                var thrust_table = make_internal_table2D('C_THRUST', [[-0.488, 0.275, 1.0, 1.225, 1.35, 1.425, 1.313, 1.125, 0.0],
                        [-0.725, 0.0, 1.0, 1.225, 1.35, 1.438, 1.344, 1.125, 0.0],
                        [-0.813, -0.25, 0.863, 1.2, 1.331, 1.438, 1.344, 1.125, 0.0],
                        [-0.813, -0.581, 0.65, 1.188, 1.306, 1.425, 1.344, 1.125, 0.0],
                        [-0.813, -0.813, 0.344, 1.069, 1.25, 1.388, 1.325, 1.125, 0.0],
                        [-0.813, -0.813, 0.019, 0.8, 1.213, 1.338, 1.325, 1.125, 0.0],
                        [-0.813, -0.813, -0.325, 0.488, 1.163, 1.269, 1.313, 1.125, 0.0],
                        [-0.813, -0.813, -0.669, 0.15, 0.956, 1.225, 1.313, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.219, 0.688, 1.206, 1.288, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.556, 0.375, 1.163, 1.263, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, 0.063, 1.0, 1.225, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.25, 0.781, 1.22, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.563, 0.563, 1.2, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, 0.3, 0.98, 1.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, 0.038, 0.62, 1.0, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.225, 0.406, 0.813, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.488, 0.213, 0.625, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.75, 0.019, 0.438, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.813, -0.175, 0.25, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.813, -0.369, 0.063, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.813, -0.563, -0.125, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.813, -0.756, -0.313, 0.0],
                        [-0.813, -0.813, -0.813, -0.813, -0.813, -0.813, -0.813, -0.813, 0.0]], ct0);
            }
            propeller.append(thrust_table);

            if (pitch == 0) {
                var power_table = make_internal_table('C_POWER', [1.025, 1.025, 1.0, 0.976, 0.92, 0.843, 0.774, 0.65, 0.531, 0.19, -0.303, -0.912, -1.548], cp0);
            }
            else {
                var power_table = make_internal_table2D('C_POWER', [[0.167, 0.333, 1.167, 2.65, 4.57, 6.5, 7.5, 8.3, 8.3],
                        [0.667, 0.167, 1.0, 2.47, 4.37, 6.5, 7.53, 8.3, 8.3],
                        [0.95, 0.267, 0.967, 2.3, 4.18, 6.5, 7.53, 8.3, 8.3],
                        [1.28, 0.583, 0.833, 2.12, 3.97, 6.5, 7.53, 8.3, 8.3],
                        [1.57, 0.883, 0.55, 1.97, 3.72, 6.37, 7.5, 8.3, 8.3],
                        [1.85, 1.183, 0.167, 1.67, 3.5, 6.08, 7.5, 8.3, 8.3],
                        [2.13, 1.47, 0.167, 1.17, 3.3, 5.77, 7.47, 8.3, 8.3],
                        [2.42, 1.175, -0.55, 0.45, 2.92, 5.53, 7.42, 8.3, 8.3],
                        [2.7, 2.03, -0.83, -0.333, 2.25, 5.45, 7.33, 8.3, 8.3],
                        [2.98, 2.32, -0.97, -1.0, 1.42, 5.3, 7.17, 8.0, 8.3],
                        [3.27, 2.6, -1.0, -1.67, 0.417, 4.7, 6.95, 7.83, 8.3],
                        [3.55, 2.88, -1.28, -2.33, -0.5, 4.0, 6.62, 7.67, 8.3],
                        [3.83, 3.17, -1.57, -3.0, -1.5, 3.25, 6.42, 7.33, 8.3],
                        [4.12, 3.45, -1.85, -3.67, -2.5, 2.32, 6.23, 7.17, 8.3],
                        [4.4, 3.73, -2.13, -4.33, -3.17, 0.97, 6.08, 6.92, 8.3],
                        [4.68, 4.02, -2.42, -5.0, -3.8, -0.33, 5.95, 6.83, 8.3],
                        [4.97, 4.3, -2.7, -5.67, -4.5, -1.5, 5.75, 6.83, 8.3],
                        [5.25, 4.58, -2.98, -6.33, -5.17, -2.67, 5.38, 6.67, 8.3],
                        [5.53, 4.87, -3.27, -7.0, -5.83, -3.83, 4.17, 6.5, 8.3],
                        [5.82, 5.15, -3.55, -7.67, -6.5, -5.0, 2.93, 6.33, 8.3],
                        [6.1, 5.43, -3.83, -8.3, -7.17, -6.17, 1.63, 6.13, 8.3],
                        [6.38, 5.72, -4.12, -8.3, -8.3, -7.33, 0.33, 5.67, 8.3],
                        [8.3, 8.3, -8.3, -8.3, -8.3, -8.3, -8.3, -5.0, 8.3]], cp0);
            }
            propeller.append(power_table);

            propeller.append('<!-- thrust effects of helical tip Mach -->');

            var ct_mach_table = $('<table/>');
            ct_mach_table.attr('name', 'CT_MACH');
            ct_mach_table.attr('type', 'internal');
            ct_mach_table.text('0.85   1.0\n'+
            '1.05   0.8');
            propeller.append(ct_mach_table);

            var cp_mach_table = $('<table/>');
            cp_mach_table.attr('name', 'CP_MACH');
            cp_mach_table.attr('type', 'internal');
            cp_mach_table.text('0.85   1.0\n'+
                '1.05   1.8\n'+
                '2.00   1.4\n');
            propeller.append(cp_mach_table);

            XML.append(propeller);
            console.log(XML.html());
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

function make_internal_table(name, coef, a) {
    var table = $('<table/>');
    table.attr('name', name);
    table.attr('type', 'internal');
    var data = "";
    coef.forEach(function(item, idx) {
        var v = 0.1 * idx;
        if (idx > 8)
            v += 0.1*(idx-8);
        data += v.toFixed(1)+'  '+(item*a).toFixed(4)+'\n';
    });
    var table_data = $('<tableData/>');
    table_data.text(data);
    table.append(table_data);

    return table;
}

function make_internal_table2D(name, coef, a) {
    var table = $('<table/>');
    table.attr('name', name);
    table.attr('type', 'internal');
    var data = "        -10        0        15        25        35        45        55        65       90\n";
    coef.forEach(function(row, i) {
        if (i < 22)
            data += ((i-1)*0.2).toFixed(2)+'    ';
        else
            data += '6.0     '
        row.forEach(function(col, j) {
            data += (col*a).toFixed(4);
        });
        data += '\n';
    });
    var table_data = $('<tableData/>');
    table_data.text(data);
    table.append(table_data);

    return table;
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
