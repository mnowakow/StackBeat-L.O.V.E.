console.log("stack loaded");

let sources = new Map();
let codes = new Map();

class stackbeatSynth {
  constructor(audio) {
    this.audio = audio;
    this.code = this.parse("");
    this.g = Function("s,R", "s=[R=s];" + this.code + "return s.pop()");
    this.lastCode = this.code;
    this.bytebeatWorker = false;
  }

  // Based on StackBeat JavaScript implementation found at esolangs: https://esolangs.org/wiki/StackBeat
  parse(code) {
    let w = code.split("");
    let r = "";
    let v = "";
    let e;
    let a = 1 * 8e3;
    while ((e = w.shift())) {
      +e == e ? (v += e) : v && ((r += "Y(" + +v + ");"), (v = "")),
        (r +=
          (e == "@"
            ? "s=s.concat(s.slice(-1))"
            : e == "_"
            ? "Y(R)"
            : e == "$"
            ? "Z"
            : e == "#"
            ? "Y(Z,Z)"
            : ~"+-*/%^&|".indexOf(e)
            ? "Y(Z" + e + "Z)"
            : ~"<>".indexOf(e)
            ? "Y(Z" + e + e + "Z)"
            : ~"~!".indexOf(e)
            ? "Y(+" + e + "Z)"
            : "") + ";");
    }

    return r.replace(/Z/g, "s.pop()").replace(/Y/g, "s.push");
  }

  async init() {
    let actx = (this.audioCtx = document.querySelector(
      "a-resonance-audio-room"
    ).components["resonance-audio-room"].audioContext);
    await console.log("wait...");

    await this.audioCtx.audioWorklet.addModule(
      "./aframe-stackbeat_love/stackbeat-worker.js"
    );

    this.stackbeatWorker = new AudioWorkletNode(
      this.audioCtx,
      "stackbeat-worker"
    );

    this.streamDestination = this.audioCtx.createMediaStreamDestination();
    this.source = this.audioCtx.createBufferSource();

    this.myArrayBuffer = this.audioCtx.createBuffer(1, 48000 * 1, 48000);
    this.source.buffer = this.myArrayBuffer;
    this.source.connect(this.streamDestination);
    this.source.start();

    this.stackbeatWorker.connect(this.streamDestination);

    this.stream = this.streamDestination.stream;

    this.audio.setAttribute("resonance-audio-src", "src", this.stream);
  }

  update(code) {
    this.code = this.parse(code);
    if (this.stackbeatWorker) {
      this.stackbeatWorker.port.postMessage(this.code);
    }
  }
}

AFRAME.registerComponent("destroy", {
  init: function () {
    var el = this.el;
    el.addEventListener("click", function () {
      console.log(codes);

      let id = el.getAttribute("id");
      if (id.includes("src")) {
        sources.delete(id);
      } else {
        codes.delete(id);
        console.log(codes);
      }
      CodeParser();
      el.destroy();
      el.parentNode.removeChild(el);
    });
  },
});

function distance3d(vec1, vec2) {
  var dx = vec1.x - vec2.x;
  var dy = vec1.y - vec2.y;
  var dz = vec1.z - vec2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function CodeParser() {
  console.log("code parser");

  for (let i = 0; i < sources.size; i++) {
    //iterate distances with all sources

    let finalCode = "";

    for (let j = 0; j < codes.size; j++) {
      //iterate through all codes
      let srcCodes = new Map();

      let srcPos = sources.get("src" + i);
      let codPos = codes.get("cod" + j);
      let dist = distance3d(srcPos, codPos);

      if (dist <= 10) {
        srcCodes.set(dist, "cod" + j);
        let resultedCodes = [...srcCodes.entries()].sort();
        console.log(resultedCodes);
        for (const element of resultedCodes) {
          let el = document.getElementById(element[1]);
          let code = el.components.text.attrValue.value;

          if (code == "n") {
            console.log("number");
            finalCode = finalCode + "" + Math.round(dist);
          } else {
            finalCode = finalCode + "" + code;
          }
        }
      }
    }

    let el = document.getElementById("src" + i);
    el.setAttribute("stackbeat_love", { code: finalCode });
  }
}

AFRAME.registerComponent("stackbeat_love", {
  synth: null,
  schema: {
    code: { default: "Hello" },
  },
  init: function () {
    let el = this.el;
    this.synth = new stackbeatSynth(el);

    this.synth.init();
    this.el.play();
    this.el.addEventListener("ElementAdded", () => {
      console.log("added");
      /*
      let code = el.childNodes[0].components["super-keyboard"].data.value;

      if (code == "666") {
        this.el.parentNode.removeChild(this.el);
      } else {
        this.el.setAttribute("stackbeat", "code", code);

        this.el.setAttribute("text", "value", code);
      } */
    });
  },
  update: function () {
    var data = this.data;
    var el = this.el;

    var resonanceRoom = document.querySelector("a-resonance-audio-room");
    el.setAttribute("resonance-audio-src", "room", resonanceRoom);
    el.setAttribute(
      "resonance-audio-src",
      "position",
      el.getAttribute("position")
    );

    this.el.setAttribute("text", "value", data.code);

    this.synth.update(data.code);
  },
});

/* global AFRAME, NAF */
AFRAME.registerComponent("stackbeat_love-drop", {
  schema: {
    template: { default: "" },
    keyCode: { default: 48 },
  },

  init: function () {
    this.onKeyPress = this.onKeyPress.bind(this);
    document.addEventListener("keypress", this.onKeyPress);
  },

  onKeyPress: function (e) {
    //console.log(String.fromCharCode(e.charCode));

    if (e.keyCode === 48) {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "src" + sources.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      sources.set("src" + sources.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-mainsource-template",
      });
      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "_") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "_" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "@") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "@" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "$") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "$" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "#") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "#" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "~") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "~" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "!") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "!" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "+") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "+" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "-") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "-" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "*") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "*" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "/") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "/" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === ">") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: ">" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "<") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "<" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "^") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "^" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "&") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "&" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "|") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "|" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "%") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "%" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }

    if (String.fromCharCode(e.charCode) === "n") {
      const el = document.createElement("a-entity");
      this.el.sceneEl.appendChild(el);
      el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("position", this.el.getAttribute("position"));
      codes.set("cod" + codes.size, {
        x: this.el.getAttribute("position").x,
        y: this.el.getAttribute("position").y,
        z: this.el.getAttribute("position").z,
      });
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      el.setAttribute("text", { value: "n" });

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(
          new CustomEvent("persistentEntityCreated", { detail: { el: el } })
        );
      });
      CodeParser();
    }
  },
});
