# aframe-stackbeat_love

StackBeat L.O.V.E. (StackBeat Location Oriented Virtual Extension) live coding A-Frame component, for live coding StackBeat L.O.V.E. in the metaverse.
Based on the Stackbeat JavaScript implementation: [StackBeat](https://esolangs.org/wiki/StackBeat), and the StackBeat A-Frame implementation: [aframe-stackbeat](https://github.com/AudioGroupCologne/aframe-stackbeat)

## Dependencies

Use this component in [A-Frame](https://aframe.io), together with the [Networked-Aframe](https://github.com/networked-aframe/networked-aframe) library, and the [A-Frame Resonance Audio](https://github.com/AudioGroupCologne/aframe-resonance-audio-component/) component.  


## Usage

### Add the stackbeat_love-drop component to your Networked-Aframe Avatar entity to include the StackBeat L.O.V.E. Live Coding environment:

```html
    <a-scene>
   <!-- Player Setting -->
      <a-entity
        id="player"
        networked="template:#avatar-template;attachTemplateToLocal:false;"
        camera
        position="0 1.6 0"
        stackbeat_love-drop
        raycaster="objects: .raycastable"
        wasd-controls="fly:true"
        look-controls
      >
    </a-scene>
```

###### Attributes:

| Property | Description | Default |
| ------------- | ------------- | ------------- |
| code | current source code  | _ |

### Add templates "stackbeat_love-mainsource-template" and "stackbeat_love-codesource-template" to your A-Scene assets:

```html
    <a-assets>
        <template id="stackbeat_love-mainsource-template">
          <a-entity
            class="raycastable"
            geometry="primitive: sphere;radius:10"
            material="wireframe:true;color:red"
            text="value:Hello World;side:double"
            resonance-audio-src="
            src:;
            loop: true;
            autoplay: true;"
            stackbeat_love=""
            destroy
          >
          </a-entity>
        </template>
        <template id="stackbeat_love-codesource-template">
          <a-entity
            class="raycastable"
            geometry="primitive: box;"
            material="wireframe:true;"
            destroy
            text
          >
          </a-entity>
        </template>
    </a-assets>

```

### Add templates the Networked-Aframe NAF.shemas: 


```javascript
        if (!NAF.schemas.hasTemplate("#stackbeat_love-mainsource-template")) {
          NAF.schemas.add({
            template: "stackbeat_love-mainsource-template",
            components: [
              "position",
              {
                component: "stackbeat_love",
                property: "code",
              },
            ],
          });
        }
        if (!NAF.schemas.hasTemplate("#stackbeat_love-codesource-template")) {
          NAF.schemas.add({
            template: "stackbeat_love-codesource-template",
            components: ["position", "text"],
          });
        }
```

###### Commands:

| Key | Description |
| ------------- | ------------- | 
| '0' | spawn new StackBeat L.O.V.E sphere  | 
| 'n' | Add number depending on the distance to the centre of the sphere   | 
| Keys corresponding to the instructions of StackBeat | Add instruction obejects corresponding to the StackBeat instructions   | 
| Click on objects | Delete corresponding object   | 

## Run on Glitch

Run or remix Stackverse on Glitch: [stackbeat-love](https://glitch.com/edit/#!/stackbeat-love) 

## Acknowledgements

The A-Frame StackBeat L.O.V.E. component is based on the StackBeat JavaScript implementation found at [esolangs](https://esolangs.org/wiki/StackBeat) and the A-Frame StackBeat component: 
