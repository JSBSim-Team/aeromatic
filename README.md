# Aeromatic
Aero-Matic is a web application that uses an HTML interface to collect user-submitted data on an airplane, then generates configuration files for use with the [JSBSim Flight Dynamics Model](https://github.com/JSBSim-Team/jsbsim). Aero-Matic tries to strike a balance between simplicity and accuracy when modeling an airplane. The generated configuration files will result in a *plausible* airplane model, and is based on only a few data points that should be easily available from books or internet sources.

## How to use Aeromatic
Lets assume we want to make a model of the MiG-21. In this case we will need two configuration files, an *aero* configuration, and an *engine* configuration. Obviously we won't need a propeller configuration for the MiG-21.

The first step is to open [Aeromatic](https://jsbsim-team.github.io/aeromatic) in a browser. Step one is to define an engine for the MiG-21. From *The Encyclopedia of World Airpower* I find the following information on the engine used by the MiG-21. Name: Tumansky_R25, type: Turbine, thrust (without afterburning): 10000 lb., and afterburning is installed, but water-injection is not. Note that the name you chose for your engine should be a suitable file name, so only use appropriate characters.

When you click on the "generate" button Aero-Matic will send the information to *engine2.php*, which will do some calculations and send the results back to you. The results will look like garbage because the configuration file was not meant to look nice in a browser window. If you view the document source you will see the file as it really is. Save this file with the file name `Tumansky_R25.xml`, and place it in the `$FGROOT/Engine` directory with all the other engines.

Skip over the propeller form and fill in the aero form. You must first select a system of units, either English or metric. You cannot mix units! Now for the airplane data. For the MiG-21 I have the following data. Name: Mig21, type: Single Engine Fighter, maximum takeoff weight: 22,000 lb., span: 23.5 feet, length: 51.75 feet, wing area: 247 square feet, tricycle landing gear (meaning the third wheel is in front of the main wheels), one engine, engine type: Turbine, engine layout: aft fuselage. My source doesn't say whether the MiG-21 had a yaw damper, but since it's a high-performance jet I'll assume it needs one.

Now click on "generate" and the data will be sent to *aero2.php*, which will do some calculations and return the configuration file to you. As with the previous configuration file, it will look like garbage in your browser window, but will look properly if you view the document source. Save this file as `Mig21.xml`, and place it in a `$FGROOT/Aircraft/Mig21` folder. You will now have to open the file in a text editor and make a change. In the Propulsion section of the aero file you will find a reference to the file name of your engine, `Mig21_engine`. Edit this name to read `Tumansky_R25`. Your Mig-21 will now be matched with a correct engine.

If you model a multi-engined airplane you must make the above change for each engine. If you are modeling a propeller-driven airplane you must also change the thruster file name to reflect the file name of the propeller configuration file. This must be done for each propeller.

**NOTE!!** Be aware that some browsers can be configured to add HTML tags and make other changes to files without telling you. This will prevent Aero-Matic from working! Also, some browsers will *reload* the current page when displaying the document source. This may result in a bad document. Also, watch out for browsers that are set to fetch *cached* pages rather than new ones.

## What Aeromatic does
### Engine Configuration
Engine.php creates a configuration file for the JSBSim engine modules according to the following table:

Engine Type | JSBSim Module 
-|-
Piston | FGPiston
Turbine | FGTurbine
TurboProp | FGTurbine
Rocket | FGRocket

The user inputs are first converted to English units. The header is then printed, and user inputs are echoed as comments. Now `engine2.php` prints data specific to the engine type. The only calculation done for the piston engine is displacement, which is based on an assumed 0.625 hp per cubic inch. All other piston engine values are "typical".

The turbine engine is modeled with an assumed bypass ratio of 1.0 and a TSFC of 0.8. Other data needed by the module are filled with "typical" values. Afterburning and water injection are enabled if so selected.

The turboprop engine is modeled as a turbine with a bypass ratio of 0 and a TSFC of 0.55. The maximum power value is converted to a maximum thrust value using the rough approximation that 1 hp equals 2.24 pounds of thrust. Thrust is then set to decrease at high speeds, thus simulating a propeller.

The rocket engine is Jon Berndt's X-15 engine.

### Propeller Configuration
`Prop.php` first converts user input to English units, then echoes the input as comments. The propeller is modeled by first estimating the total "linear blade inches", i.e. sum of all blade lengths, needed to absorb the engine's power. I use 5.3 times the square root of the horsepower, a formula based only on curve-fitting a sample of engine/prop combinations. No science here. The number of blades is estimated using the following chart:

Engine Horsepower | No. of blades
-|-
< 400 | 2
400 < - < 1400 | 3
1400+ | 4

The mass of each blade is estimated to be 0.9317 slugs per foot. The rest of the values are "typical".

### Aero Configuration
`Aero.php` first converts user input to English units. The first calculation is to estimate wing loading at maximum weight based on the aircraft type as per this chart:

Aircraft Type | Wing loading (psf)
-|-
Glider | 7
Light Single | 14
Light Twin | 29
WWII Fighter, racer, aerobatic | 45
Single Engine Transonic/Supersonic Fighter | 95
Two Engine Transonic/Supersonic Fighter | 100
Two Engine Transonic Transport | 110
Three Engine Transonic Transport | 110
Four+ Engine Transonic Transport | 110
Multi-engine Prop Transport | 57

If the user did not supply a wing area, then the wing loading and maximum weight are used to estimate one. If the user *does* supply a wing area, then the actual wing loading is calculated and is used in lieu of the charted value.

Once wing area has been established, it is divided by wing span to give the mean aerodynamic chord. The areas of the tail surfaces are estimated by multiplying wing area by a factor depending on aircraft type. The moment arms of the tail surfaces are similarly estimated from the aircraft length and type.

The airplane's moments of inertia about three axes are estimated using Roskam's formulae and constants for various airplane types. Presently I'm increasing the moments by 50% to make up for a lack of feel in the control stick.

The aircaft's ZFW, zero-fuel weight, is estimated by multplying the maximum weight by a factor according to aircraft type. This value is named "empty weight" in the JSBSim configuration.

Next the aircraft's center of gravity, CG, location is estimated. The longitudinal (x axis) location was already assumed when the horizontal stablizer moment arm was estimated, so this distance is used to get the longitudinal location of the CG from the nose, in inches. The CG is located on the intersection of the x and y axes, under the assumtion that the aircraft is laterally symetric, so the y location is zero. I've put the vertical (z) location of the CG a bit below centerline. The location of the aerodynamic center is, for simplicity, the same as the CG, except it is a bit above the CG to help with stability.

The location of the pilot's eyepoint is then estimated based on aircraft type.

The landing gear location is based on the CG location. Tricycle main wheels are placed slightly behind the CG, and taildragger main wheels slightly ahead. The lateral spread of the main gear is a function of wing span and airplane type. The z-position of the main gear is based on the airplane's length. This is the distance in inches from the centerline to the bottom of the tire when the gear is extended and hanging freely. Note that the glider presents a problem in that JSBSim presently supports three ground contact points, whereas a glider needs five (main wheel, nose skid, tail wheel, and two wing tip skids). The locations of the nose or tail wheels is estimated from the airplane length and the location of the main gear.

The engines and thrusters are positioned according to the user-selected engine layout, and some assumptions on engine spacing and location. There are N+1 fuel tanks for an N-engined airplane. All fuel tanks are located at the aircraft center of gravity and contain 500 pounds of fuel.

The FCS, flight control system, is the same for every airplane, except for the yaw damper, which is only added if desired by the user.

The lift force is based on a lift-vs-alpha curve made from four points, using the assumed CL_0, CL_alpha and CL_max for the aircraft type. Additional lift due to flaps is estimated based on aircraft type. Some types will have a lift decrement due to speedbrakes (or spoilers). All types have a lift contribution due to elevator deflection, based on aircraft type.

The drag force consists of CD0 (drag at zero-lift), CDi (induced drag), CDmach (drag due to compressibility), CDflap, CDgear, CDsb (speedbrakes), CDbeta (drag due to side slip), and CDde (drag due to elevator deflection).

The only side force used is the force due to yaw angle (sideslip).

Roll moments used are Clbeta (roll due to sideslip), Clp (roll damping), Clr (roll due to yaw rate), Clda (roll due to ailerons), and Cldr (roll due to rudder deflection).

Pitch moments used are Cmalpha (pitch due to angle-of-attack), Cmde (pitch due to elevator deflection), Cmq (pitch due to pitch rate), and Cmadot (pitch due to alpha rate).

Yaw moments are Cnbeta (yaw due to sideslip), Cnr (yaw damping), Cndr (yaw due to rudder deflection), and Cnda (adverse yaw).

## Credits
This is based on the original PHP application by David P. Culp and has been ported to HTML/CSS/JavaScript by Bertrand Coconnier.
