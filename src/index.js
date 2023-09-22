
const resultElement = document.getElementById("result");
const pantoneElement = document.getElementById("result-pantone");
let colorsMap = new Map();

const hexToRGB = (hex) => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
}

const colorDistance = (rgb1, rgb2) => {
    const [r1, g1, b1] = rgb1;
    const [r2, g2, b2] = rgb2;
    return ((r2 - r1) * 0.30) ** 2 + ((g2 - g1) * 0.59) ** 2 + ((b2 - b1) * 0.11) ** 2
}

const findClosestPantone = (colors, r, g, b) => {
    let closestColor = {};
    let minDistance = Infinity;
    const namedColors = new Map([...colors].filter(([k, v]) => {
        return v["name"] && v["name"].length > 0;
    }));
    for (let [key, value] of namedColors.entries()) {
        let distance = colorDistance([r, g, b], [value["r"], value["g"], value["b"]])
        if (minDistance > distance) {
            minDistance = distance;
            closestColor = key;
        }
    }
    return [closestColor, colors.get(closestColor)];
}

const setPantone = (colorId, color) => {
    const [r, g, b] = [color["r"], color["g"], color["b"]]
    pantoneElement.style.display = "grid";
    document.getElementById("hex-val-ref-pantone").value = color["hex"];
    document.getElementById("rgb-val-ref-pantone").value = `rgb(${r.toString()}, ${g.toString()}, ${b.toString()})`;
    document.getElementById("name-ref-pantone").value = color["name"] ? color["name"] : colorId;
    document.getElementById("picked-color-ref-pantone").style.backgroundColor = color["hex"];
}

document.getElementById("pick-color").addEventListener("click", () => {
    if (!window.EyeDropper) {
        const errorElement = document.getElementById("error")
        errorElement.textContent =
            "Your browser does not support the EyeDropper API";
        errorElement.classList.remove("hide");
        return;
    }

    const eyeDropper = new EyeDropper();
    const abortController = new AbortController();

    eyeDropper
        .open({ signal: abortController.signal })
        .then((result) => {
            let hexValue = result.sRGBHex;
            let [r, g, b] = hexToRGB(hexValue);
            let rgbValue = `rgb(${r.toString()}, ${g.toString()}, ${b.toString()})`;

            resultElement.style.display = "grid";
            document.getElementById("hex-val-ref").value = hexValue;
            document.getElementById("rgb-val-ref").value = rgbValue;
            document.getElementById("picked-color-ref").style.backgroundColor = hexValue;

            if (colorsMap.size === 0) {
                fetch("https://raw.githubusercontent.com/annkamsk/closest-pantone/main/resources/colors_dict.json")
                    .then((response) => response.json())
                    .then((json) => {
                        colorsMap = new Map(Object.entries(json));

                        const [colorId, closestColor] = findClosestPantone(colorsMap, r, g, b);
                        setPantone(colorId, closestColor);

                    });
            } else {
                const [colorId, closestColor] = findClosestPantone(colorsMap, r, g, b);
                setPantone(colorId, closestColor);
            }
        })
        .catch((e) => {
            const errorElement = document.getElementById("error");
            errorElement.classList.remove("hide");

            //If user presses escape to close the eyedropper
            if (e.toString().includes("AbortError")) {
                errorElement.innerText = "";
            } else {
                errorElement.innerText = e;
            }
        });

    setTimeout(() => {
        abortController.abort();
    }, 2000);

});

// Allow user to choose image of their own choice
const fileInput = document.getElementById("file");
fileInput.onchange = () => {
    resultElement.style.display = "none";
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);
    reader.onload = () => {
        document.getElementById("image").setAttribute("src", reader.result);
    };
};