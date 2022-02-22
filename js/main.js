//
// MAIN
//
const menu = document.querySelector("#menu");
const switchFile = document.querySelector("#showOpenedFiles");
const dropdownFile = document.querySelector("#openedFiles");
const openedFilesUl = document.querySelector("#openedFilesList");
const rename = document.querySelector("#name");
const dropdownMenu = document.querySelector("#dropdownFile");
const holder = document.querySelector("#holder");
const backCanvas = document.querySelector("#backCanvas");
const widthInput = document.querySelector("#widthInput");
const menuCreate = document.querySelector("#create");
const saveCanvas = document.querySelector("#save");
const saveCanvasAs = document.querySelector("#saveas");
const menuInsert = document.querySelector("#insert");
const menuAbout = document.querySelector("#about");

let openedDropdown = null;
let openedEl = null;

let openedFileIndex = 0;
let createdFilesNumber = 0;

let animationFrameNum;

function checkDropdown(event, parentElement, dropdown) {
    if (openedDropdown) {
        hideDropdown();
    } else {
        showDropdown(parentElement, dropdown);
        document.addEventListener("click", closeDropdownOnClick);
        event.stopPropagation();
    }
}

function hideDropdown() {
    if (!openedDropdown) return;

    openedDropdown.classList.add("hidden");
    openedEl.closest("li").classList.remove("opened");
    openedDropdown = null;
    openedEl = null;
}

function showDropdown(parentElement, dropdown) {
    dropdown.classList.remove("hidden");
    parentElement.closest("li").classList.add("opened");
    openedDropdown = dropdown;
    openedEl = parentElement;
}

function closeDropdownOnClick(e) {
    if (openedDropdown && e.target.closest("div") !== openedDropdown) {
        hideDropdown();
        document.removeEventListener("click", closeDropdownOnClick);
    }
}

function createLi(text, callback) {
    const li = document.createElement("li");
    li.className = "dropdown__list-item";
    li.dataset.index = createdFilesNumber;

    const btn = document.createElement("button");
    btn.className = "dropdown__list-btn";
    btn.innerHTML = text;
    btn.addEventListener("click", callback);

    const removeBtn = document.createElement("button");
    removeBtn.className = "dropdown__list-remove";

    const img = document.createElement("img");
    img.src = "img/remove.svg";

    removeBtn.append(img);
    removeBtn.addEventListener("click", isToRemoveFile);

    li.append(btn);
    li.append(removeBtn);

    return li;
}

function isToRemoveFile(e) {
    const isSaved = holder.querySelector(
        `[data-canvas="${e.target.closest("li").dataset.index}"]`
    ).firstChild.isSaved;

    if (isSaved) {
        removeFile(e);
        return;
    }

    const name = e.target.closest("li").firstChild.innerHTML.slice(0, -1);

    const para = document.createElement("p");
    para.innerHTML = `Изменения не были сохранены. Действительно удалить файл: <span>${name}</span>?`;

    const div = document.createElement("div");
    div.className = "btns__wrapper";

    const closeBtn = document.createElement("button");
    closeBtn.className = "modal__close";
    closeBtn.innerHTML = "✖";
    closeBtn.onclick = hideModal;

    const btn1 = document.createElement("button");
    btn1.innerHTML = "Нет";
    btn1.className = "modal__btn modal__btn-main";
    btn1.onclick = hideModal;

    const btn2 = document.createElement("button");
    btn2.innerHTML = "Да";
    btn2.className = "modal__btn";
    btn2.onclick = () => {
        removeFile(e);
        hideModal();
    };

    div.append(btn1, btn2);

    showModal(450, 150, para, div, closeBtn, createTitleSpan("Удаление"));
}

function removeFile(e) {
    const li = e.target.closest("li");
    const ul = li.parentElement;

    e.target.closest("li").remove();
    cancelAnimationFrame(animationFrameNum);
    holder.querySelector(`[data-canvas="${+li.dataset.index}"]`).remove();

    if (ul.children.length > 1) {
        openedFileIndex = +ul.children[0].dataset.index;
        rename.innerHTML = ul.children[0].children[0].innerHTML;
        showCanvas(+ul.children[0].dataset.index);
    } else {
        rename.innerHTML = "Создать рисунок";
        openedFileIndex = 0;
        saveCanvas.disabled = true;
        saveCanvasAs.disabled = true;
        menuInsert.disabled = true;
        holder.hidden = true;
    }
}

function createFile(name) {
    if (openedFileIndex) hideCurrentCanvas();
    if (name instanceof PointerEvent) name = "";

    createdFilesNumber++;

    const fileName = name || "Новый рисунок " + createdFilesNumber;
    rename.innerHTML = fileName;
    openedFileIndex = createdFilesNumber;

    const li = createLi(fileName, () => {
        hideDropdown();
        if (openedFileIndex === +li.dataset.index) return;
        hideCurrentCanvas();
        openedFileIndex = +li.dataset.index;
        rename.innerHTML = li.children[0].innerHTML;
        showCanvas(openedFileIndex);
    });

    openedFilesUl.prepend(li);

    saveCanvas.disabled = false;
    saveCanvasAs.disabled = false;
    menuInsert.disabled = false;
    holder.hidden = false;

    createCanvas(createdFilesNumber);
    hideDropdown();
}

function renameFile(e) {
    if (openedDropdown) return;
    if (!openedFileIndex) return;

    e.stopPropagation();

    const target = e.target;
    const li = target.closest("li");
    const arrow = li.children[1];
    const input = document.createElement("input");

    input.type = "text";
    input.value = isFileSaved()
        ? target.innerHTML.trim()
        : target.innerHTML.slice(0, -1);
    input.className = "rename";
    input.style.width = li.clientWidth + "px";
    input.maxLength = 45;

    const initialName = input.value;

    input.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === "Escape") input.blur();
    };

    input.onblur = (e) => {
        const value = e.target.value.trim();

        if (value) {
            target.innerHTML = value;
        } else {
            target.innerHTML = target.innerHTML.trim();
        }

        li.innerHTML = "";
        li.append(target);
        li.append(arrow);

        openedFilesUl.querySelector(
            `[data-index="${openedFileIndex}"]`
        ).children[0].innerHTML = value;

        if (initialName !== value) setFileUnsaved(true);
    };

    li.innerHTML = "";
    li.append(input);
    input.select();
}

function hideCurrentCanvas() {
    const canvas = holder.querySelector(`[data-canvas="${openedFileIndex}"]`);

    canvas.classList.add("hidden");
    cancelAnimationFrame(animationFrameNum);
}

function showCanvas(index) {
    const canvasWrapper = holder.querySelector(`[data-canvas="${index}"]`);
    const canvas = canvasWrapper.firstChild;

    canvasWrapper.classList.remove("hidden");
    renderCanvasPicture(canvas, canvas.getContext("2d"))();
    updateContext();
}

function createCanvas(index) {
    const div = document.createElement("div");
    div.className = "canvas__holder";
    div.dataset.canvas = index;

    const canvas = document.createElement("canvas");
    canvas.width = "1196";
    canvas.height = "796";
    canvas.isSaved = true;
    canvas.cameraZoom = 1;
    canvas.offscreenCanvas = document.createElement("canvas");
    canvas.offscreenCanvas.width = canvas.width;
    canvas.offscreenCanvas.height = canvas.height;

    setFill(canvas);
    setFill(canvas.offscreenCanvas);

    div.append(canvas);
    holder.prepend(div);

    drawOnCanvas(canvas);
    renderCanvasPicture(canvas, canvas.getContext("2d"))();
    updateContext();

    function setFill(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function isFileSaved() {
    return holder.querySelector(`[data-canvas="${openedFileIndex}"]`).firstChild
        .isSaved;
}

function setFileUnsaved(isNameSwitch) {
    const canvas = holder.querySelector(
        `[data-canvas="${openedFileIndex}"]`
    ).firstChild;
    const isSaved = canvas.isSaved;

    if (isSaved || isNameSwitch) {
        rename.innerHTML += "*";
        openedFilesUl.querySelector(
            `[data-index="${openedFileIndex}"]`
        ).firstChild.innerHTML += "*";
    }

    canvas.isSaved = false;
}

function setFileSaved() {
    const canvas = holder.querySelector(
        `[data-canvas="${openedFileIndex}"]`
    ).firstChild;
    const isSaved = canvas.isSaved;

    if (!isSaved) {
        rename.innerHTML = rename.innerHTML.slice(0, -1);

        const btn = openedFilesUl.querySelector(
            `[data-index="${openedFileIndex}"]`
        ).firstChild;

        btn.innerHTML = btn.innerHTML.slice(0, -1);
    }

    canvas.isSaved = true;
}

menu.onclick = (e) => {
    checkDropdown(e, menu, dropdownMenu);
};

switchFile.onclick = (e) => {
    checkDropdown(e, switchFile, dropdownFile);
};

rename.onclick = renameFile;

createFileBtn.onclick = createFile;

//
// MENU
//

let modalElements = [];

function showModal(width, height, ...elements) {
    const div = document.createElement("div");
    div.className = "modal__wrapper";

    div.onmousedown = (e) => {
        if (e.target.closest(".modal__inner")) return;

        hideModal();
    };

    const innerDiv = document.createElement("div");
    innerDiv.className = "modal__inner";
    innerDiv.style.width = width + "px";
    innerDiv.style.height = height + "px";
    innerDiv.append(...elements);

    const line = document.createElement("div");
    line.className = "modal__line";
    line.style.width = width - 10 + "px";

    modalElements.push(div);

    innerDiv.append(line);
    div.append(innerDiv);

    document.body.append(div);
}

function hideModal() {
    modalElements.pop().remove();
}

function createCloseBtn() {
    const closeBtn = document.createElement("button");
    closeBtn.className = "modal__close";
    closeBtn.innerHTML = "✖";
    closeBtn.onclick = hideModal;

    return closeBtn;
}

function createManageBtnsWrapper(
    value1,
    value2,
    nodeName2,
    isDisabled = false
) {
    const div = document.createElement("div");
    div.className = "btns__wrapper";

    const btn1 = document.createElement("button");
    btn1.innerHTML = value1;
    btn1.className = "modal__btn";
    btn1.onclick = hideModal;

    const btn2 = document.createElement(nodeName2);

    if (nodeName2 === "input") {
        btn2.type = "submit";
        btn2.value = value2;
    } else {
        btn2.innerHTML = value2;
    }

    btn2.className = "modal__btn modal__btn-main";
    btn2.disabled = isDisabled;

    div.append(btn1, btn2);

    return div;
}

function createTitleSpan(text) {
    const span = document.createElement("span");
    span.className = "modal__title";
    span.innerHTML = text;

    return span;
}

menuCreate.onclick = function () {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Название файла";
    input.maxLength = 45;

    const div = createManageBtnsWrapper("Отмена", "Создать", "button");

    div.children[1].onclick = () => {
        hideModal();
        createFile(input.value);
    };

    hideDropdown();
    showModal(
        400,
        150,
        input,
        div,
        createCloseBtn(),
        createTitleSpan("Создать файл")
    );
};

saveCanvas.onclick = function () {
    if (!isFileSaved()) saveCanvasAs.click();
};

saveCanvasAs.onclick = function () {
    const input = document.createElement("input");
    input.type = "text";
    input.value = isFileSaved()
        ? rename.innerHTML
        : rename.innerHTML.slice(0, -1);
    input.placeholder = "Введите название файла";
    input.style.width = "90%";
    input.style.marginBottom = "0";

    const select = document.createElement("select");
    select.add(new Option(".jpg", ".jpg"));
    select.add(new Option(".bmp", ".bmp"));

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.width = "100%";
    wrapper.append(input, select);

    const btnsWrapper = createManageBtnsWrapper(
        "Отмена",
        "Сохранить",
        "button"
    );

    btnsWrapper.children[1].onclick = () => {
        const currentCanvas = document.querySelector(
            `[data-canvas="${openedFileIndex}"]`
        ).firstChild;

        hideDropdown();
        hideModal();

        setFileSaved();

        const link = document.createElement("a");
        link.setAttribute("href", currentCanvas.toDataURL(`image/jpeg`));
        link.setAttribute("download", rename.innerHTML + `${select.value}`);
        link.click();
    };

    showModal(
        400,
        150,
        wrapper,
        createCloseBtn(),
        btnsWrapper,
        createTitleSpan("Сохранить как")
    );
};

menuInsert.onclick = function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg, .jpeg, .bmp";
    input.name = "file";

    input.onchange = () => {
        if (!input.value) {
            btn2.disabled = true;
            return;
        }

        btn2.disabled = false;
    };

    const div = createManageBtnsWrapper("Отмена", "Ок", "input", true);
    const btn2 = div.children[1];

    const form = document.createElement("form");
    form.append(input, div);

    form.onsubmit = (e) => {
        e.preventDefault();
        hideModal();

        const formData = new FormData(form);
        const file = formData.get("file");
        const reader = new FileReader();
        const img = new Image();
        reader.readAsDataURL(file);

        const canvas = holder.querySelector(
            `[data-canvas="${openedFileIndex}"]`
        )?.firstChild;

        reader.onload = function () {
            img.src = reader.result;
            setTimeout(() => {
                canvas.getContext("2d").drawImage(img, 0, 0);
                saveOffscreenCanvas(canvas);
            });
        };

        setFileUnsaved();
    };

    showModal(300, 150, form, createCloseBtn(), createTitleSpan("Вставить из"));
};

menuAbout.onclick = function () {
    const h1 = document.createElement("h1");
    h1.innerHTML = "MyPaint";

    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "space-between";
    div.style.width = "100%";

    const p = document.createElement("p");
    p.innerHTML =
        "MyPaint разработал студент 2 курса ВШЭ ПИ-20-1 Исаев Максим mvisaev_2@edu.hse.ru";
    p.style.lineHeight = "1.5";
    p.style.fontSize = "16px";

    const img = new Image();
    img.src = "img/star.svg";
    img.height = 100;
    img.width = 100;

    div.append(p, img);

    showModal(
        400,
        200,
        createCloseBtn(),
        div,
        createTitleSpan("Информация о программе")
    );
};

//
// INSTRUMENTS
//

const instrument = document.querySelector("#instruments");
const dropdownInstruments = document.querySelector("#instrumentsDropdown");
const instrumentChoose = document.querySelector("#instrumentChoose");
const highlight = document.querySelector("#highlight");
const highlightUnderline = document.querySelector("#highlightUnderline");
const vertexNum = document.querySelector("#vertexNumber");
const colorSection = document.querySelector(".color");
const allowedArr = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "backspace",
    "delete",
    "arrowleft",
    "arrowright",
];

let isInstrumentsShow = false;
let currentFigure = "Ручка";

let isCooldown = false;
function debounce(inputElement, callback) {
    if (isCooldown) return;

    inputElement.closest("div").classList.remove("wrong");
    isCooldown = true;

    setTimeout(() => {
        isCooldown = false;
        callback();
    }, 1000);
}

function inputEvent(inputElement, allowedValuesArr, debounceCallback) {
    inputElement.onkeydown = function (e) {
        if (!allowedValuesArr.includes(e.key.toLowerCase())) e.preventDefault();
        debounce(inputElement, debounceCallback);
    };

    inputElement.onfocus = () => inputElement.select();
}

inputEvent(widthInput, allowedArr, () => {
    if (+widthInput.value <= 3) {
        if (+widthInput === 3) {
            widthInput.value = 3;
            widthInput.select();
        }

        widthComplete.style.width = "5px";
        widthDrag.style.left = 0;
        updateContext();
        return;
    }

    if (+widthInput.value >= 60) {
        if (+widthInput === 60) {
            widthInput.value = 60;
            widthInput.select();
        }

        widthComplete.style.width = "175px";
        widthDrag.style.left = "170px";
        updateContext();
        return;
    }

    widthComplete.style.width = widthInput.value * 3 - 5 + "px";
    widthDrag.style.left = widthInput.value * 3 - 10 + "px";
    updateContext();
});

inputEvent(
    currentColor,
    allowedArr.concat(["a", "b", "c", "d", "e", "f"]),
    () => {
        if (
            currentColor.value.length !== 3 &&
            currentColor.value.length !== 6
        ) {
            currentColor.closest("div").classList.add("wrong");
        } else {
            updateContext();

            if (currentColor.value.length === 3) {
                colorPicker.value =
                    "#" +
                    currentColor.value
                        .split("")
                        .map((letter) => letter + letter)
                        .join("");
                return;
            }
            colorPicker.value = "#" + currentColor.value;
        }
    }
);

inputEvent(vertexNum, allowedArr, () => {
    if (+vertexNum.value < 3) {
        vertexNum.value = 3;
        vertexNum.select();
        return;
    }
    if (+vertexNum.value > 20) {
        vertexNum.value = 20;
        vertexNum.select();
        return;
    }
});

instrument.onclick = function (e) {
    if (!isInstrumentsShow) {
        instrument.classList.add("opened");
        dropdownInstruments.classList.remove("shifted");
        holder.classList.add("shift");
    } else {
        instrument.classList.remove("opened");
        dropdownInstruments.classList.add("shifted");
        holder.classList.remove("shift");
    }

    isInstrumentsShow = !isInstrumentsShow;
};

instrumentChoose.onclick = function (e) {
    const target = e.target.closest("button");

    if (!target) return;

    Array.from(target.parentElement.children).forEach((el) =>
        el.classList.remove("selected")
    );

    target.classList.add("selected");
    const number = +target.dataset.number;

    highlight.style.left = 46 * number + "px";
    highlightUnderline.style.left = 46 * number + "px";
    drawOption.innerHTML = target.dataset.figure;
    currentFigure = target.dataset.figure;
    updateContext();

    if (currentFigure === "Звезда") {
        vertex.classList.remove("shifted");
    } else {
        vertex.classList.add("shifted");
    }
};

colorSection.onclick = function (e) {
    if (!e.target.dataset.color) return;

    colorPicker.value = e.target.dataset.color;
    currentColor.value = e.target.dataset.color.slice(1).toLowerCase();
    updateContext();
};

widthDrag.onmousedown = function () {
    document.addEventListener("mousemove", mousemove);
    const coords = widthLine.getBoundingClientRect();
    document.body.style.userSelect = "none";

    function mousemove(e) {
        if (e.clientX - 5 < coords.x) {
            widthComplete.style.width = "5px";
            widthDrag.style.left = 0;
            widthInput.value = 3;
            return;
        }

        if (e.clientX + 5 > coords.x + 180) {
            widthComplete.style.width = "175px";
            widthDrag.style.left = "170px";
            widthInput.value = 60;
            return;
        }

        widthComplete.style.width = e.clientX - coords.x + "px";
        widthDrag.style.left = e.clientX - coords.x - 5 + "px";
        widthInput.value = Math.trunc(
            (Number.parseInt(widthComplete.style.width) + 5) / 3
        );
    }

    document.onmouseup = function () {
        document.removeEventListener("mousemove", mousemove);
        document.onmouseup = null;
        document.body.style.userSelect = "";
        updateContext();
    };
};

widthDrag.ondragstart = function () {
    return false;
};

colorPicker.oninput = function (e) {
    e.target.style.backgroundColor = e.target.value;
    currentColor.value = e.target.value.slice(1);
    updateContext();
};

//
// Canvas drawing
//

let zoomTo = { x: 0, y: 0 };

function renderCanvasPicture(canvas, ctx) {
    return function () {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(zoomTo.x, zoomTo.y);
        ctx.scale(canvas.cameraZoom, canvas.cameraZoom);
        ctx.translate(-zoomTo.x, -zoomTo.y);
        loadOffscreenCanvas(canvas);
        animationFrameNum = requestAnimationFrame(
            renderCanvasPicture(canvas, ctx)
        );
    };
}

function saveOffscreenCanvas(canvas) {
    const context = canvas.offscreenCanvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(canvas, 0, 0);
}

function loadOffscreenCanvas(canvas) {
    canvas.getContext("2d").drawImage(canvas.offscreenCanvas, 0, 0);
}

function updateContext() {
    const canvas = holder.querySelector(
        `[data-canvas="${openedFileIndex}"]`
    )?.firstChild;

    const ctx = canvas?.getContext("2d");

    if (ctx) {
        updateCanvasColor(currentColor.value, ctx);
        updateCanvasWidth(ctx);
        updateCanvasFigure(ctx);
        updateCanvasCursor(canvas);
    }
}

function updateCanvasColor(color, ctx) {
    if (currentFigure === "Ластик") {
        ctx.strokeStyle = "#fff";
        return;
    }

    ctx.strokeStyle = "#" + color;
}

function updateCanvasWidth(ctx) {
    ctx.lineWidth = +widthInput.value;
}

function updateCanvasFigure(ctx) {
    ctx.figure = currentFigure;
}

function updateCanvasCursor(canvas) {
    switch (currentFigure) {
        case "Масштаб-":
            canvas.style.cursor = "zoom-out";
            break;

        case "Масштаб+":
            canvas.style.cursor = "zoom-in";
            break;

        default:
            canvas.style.cursor = "";
            break;
    }
}

const getFigureFunction = (canvas, ctx) => (e) => {
    switch (currentFigure) {
        case "Ручка":
            canvas.cameraZoom = 1;
            setFileUnsaved();
            return canvasPen(e, canvas, ctx);
        case "Ластик":
            canvas.cameraZoom = 1;
            setFileUnsaved();
            return canvasPen(e, canvas, ctx);
        case "Линия":
            canvas.cameraZoom = 1;
            return drawLineFramesCanvas(e, ctx, canvas);
        case "Эллипс":
            canvas.cameraZoom = 1;
            return drawEllipseFramesCanvas(e, ctx, canvas);
        case "Звезда":
            canvas.cameraZoom = 1;
            return drawStarFramesCanvas(e, ctx, canvas);
        case "Масштаб-":
            return canvasZoomOut(e, canvas, ctx);
        case "Масштаб+":
            return canvasZoomIn(e, canvas, ctx);
    }
};

function drawOnCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.figure = currentFigure;

    canvas.onmousedown = getFigureFunction(canvas, ctx);
}

function canvasPen(e, canvas, ctx) {
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    ctx.lineTo(e.offsetX - e.movementX, e.offsetY - e.movementY);
    ctx.stroke();
    canvas.addEventListener("mousemove", draw);

    function draw(e) {
        ctx.moveTo(e.offsetX, e.offsetY);
        ctx.lineTo(e.offsetX - e.movementX, e.offsetY - e.movementY);
        ctx.stroke();

        saveOffscreenCanvas(canvas);
    }

    document.onmouseup = function () {
        canvas.removeEventListener("mousemove", draw);
        document.onmouseup = null;
        ctx.closePath();

        saveOffscreenCanvas(canvas);
    };
}

function isMouseMoved(sx, sy, ex, ey) {
    return !(sx === ex && sy === ey);
}

function canvasZoomOut(e, canvas, ctx) {
    if (canvas.cameraZoom > 0.125) {
        canvas.cameraZoom /= 2;
        if (canvas.cameraZoom < 1) {
            zoomTo.x = canvas.width / 2;
            zoomTo.y = canvas.height / 2;
        }
    }
}

function canvasZoomIn(e, canvas, ctx) {
    if (canvas.cameraZoom < 8) {
        zoomTo.x = e.offsetX;
        zoomTo.y = e.offsetY;
        canvas.cameraZoom *= 2;
    }
}

//
// Trace canvas
//

function initFramesCanvas(ctx) {
    backCanvas.style.zIndex = 5;
    ctx.strokeStyle = "#" + currentColor.value;
    ctx.lineWidth = +widthInput.value;
    ctx.lineCap = "round";
}

function drawLineFramesCanvas(event, context, canvas) {
    const ctx = backCanvas.getContext("2d");

    initFramesCanvas(ctx);

    backCanvas.addEventListener("mousemove", onMove);

    function onMove(e) {
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);

        if (e.shiftKey) {
            drawStraightLine(
                event.offsetX,
                event.offsetY,
                e.offsetX,
                e.offsetY,
                ctx
            );
        } else {
            drawLine(event.offsetX, event.offsetY, e.offsetX, e.offsetY, ctx);
        }
    }

    function drawLine(sx, sy, ex, ey, ctx) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.closePath();
    }

    function drawStraightLine(sx, sy, ex, ey, ctx) {
        const dx = ex - sx;
        let dy = sy - ey;
        const quarter = getQuarter(sx, sy, ex, ey);
        const tg = dx / dy;
        const deg = (Math.atan(tg) * 180) / Math.PI;

        if (!(quarter % 2)) {
            dy = -dy;
        }

        const diff = (dy - dx) / 2;

        switch (quarter) {
            case 1:
            case 3:
                if (deg < 22.5) {
                    drawLine(sx, sy, sx, ey, ctx);
                } else if (deg < 67.5) {
                    drawLine(sx, sy, ex + diff, ey + diff, ctx);
                } else {
                    drawLine(sx, sy, ex, sy, ctx);
                }
                break;

            case 2:
            case 4:
                if (deg > -22.5) {
                    drawLine(sx, sy, sx, ey, ctx);
                } else if (deg > -67.5) {
                    drawLine(sx, sy, ex + diff, ey - diff, ctx);
                } else {
                    drawLine(sx, sy, ex, sy, ctx);
                }
                break;
        }
    }

    function getQuarter(sx, sy, ex, ey) {
        let quarter;

        if (sx > ex) {
            if (sy > ey) {
                quarter = 4;
            } else {
                quarter = 3;
            }
        } else {
            if (sy > ey) {
                quarter = 1;
            } else {
                quarter = 2;
            }
        }

        return quarter;
    }

    document.onmouseup = backCanvas.onmouseleave = function (e) {
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
        backCanvas.removeEventListener("mousemove", onMove);
        backCanvas.style.zIndex = "";
        document.onmouseup = null;
        backCanvas.onmouseleave = null;

        if (!isMouseMoved(event.offsetX, event.offsetY, e.offsetX, e.offsetY))
            return;

        if (e.shiftKey) {
            drawStraightLine(
                event.offsetX,
                event.offsetY,
                e.offsetX,
                e.offsetY,
                context
            );
        } else {
            drawLine(
                event.offsetX,
                event.offsetY,
                e.offsetX,
                e.offsetY,
                context
            );
        }

        setFileUnsaved();
        saveOffscreenCanvas(canvas);
    };
}

function drawEllipseFramesCanvas(event, context, canvas) {
    const ctx = backCanvas.getContext("2d");

    initFramesCanvas(ctx);

    let ellipse;
    const startX = event.offsetX;
    const startY = event.offsetY;

    backCanvas.addEventListener("mousemove", drawEllipse);

    document.onmouseup = function (e) {
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);

        if (isMouseMoved(event.offsetX, event.offsetY, e.offsetX, e.offsetY)) {
            context.stroke(ellipse);
            setFileUnsaved();
        }

        saveOffscreenCanvas(canvas);
        backCanvas.removeEventListener("mousemove", drawEllipse);
        backCanvas.style.zIndex = "";
        document.onmouseup = null;
    };

    function drawEllipse(e) {
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);

        const endX = e.offsetX;
        const endY = e.offsetY;

        const centerX = Math.min(startX, endX) + Math.abs(startX - endX) / 2;
        const centerY = Math.min(startY, endY) + Math.abs(startY - endY) / 2;
        const radiusX = Math.abs(startX - endX) / 2;
        const radiusY = Math.abs(startY - endY) / 2;

        ellipse = new Path2D();

        if (!e.shiftKey) {
            ellipse.ellipse(
                centerX,
                centerY,
                radiusX,
                radiusY,
                0,
                0,
                2 * Math.PI
            );
        } else {
            const radius = Math.min(radiusX, radiusY);
            const [centerX, centerY] = countCenters(
                startX,
                startY,
                endX,
                endY,
                radius
            );

            ellipse.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
        ctx.stroke(ellipse);
        ctx.closePath();
    }
}

function drawStarFramesCanvas(e, context, canvas) {
    const ctx = backCanvas.getContext("2d");

    initFramesCanvas(ctx);

    const startX = e.offsetX;
    const startY = e.offsetY;
    const spikes = +vertexNum.value;

    const ctxDrawFunc = prepareDrawStar(ctx, true);

    backCanvas.addEventListener("mousemove", ctxDrawFunc);

    document.onmouseup = function (e) {
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);

        if (isMouseMoved(startX, startY, e.offsetX, e.offsetY)) {
            prepareDrawStar(context)(e);
            setFileUnsaved();
        }

        saveOffscreenCanvas(canvas);

        backCanvas.removeEventListener("mousemove", ctxDrawFunc);
        backCanvas.style.zIndex = "";
        document.onmouseup = null;
    };

    function prepareDrawStar(ctx, isNeededToClear) {
        return function (e) {
            const endX = e.offsetX;
            const endY = e.offsetY;

            const diffX = Math.abs(startX - endX);
            const diffY = Math.abs(startY - endY);

            const outerRadius = Math.min(diffX, diffY) / 2;
            const innerRadius = Math.round(outerRadius * 0.38);

            const [centerX, centerY] = countCenters(
                startX,
                startY,
                endX,
                endY,
                outerRadius
            );

            if (isNeededToClear) {
                ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
            }

            drawStar(ctx, centerX, centerY, spikes, outerRadius, innerRadius);
        };
    }

    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.stroke();
    }
}

function countCenters(startX, startY, endX, endY, radius) {
    const diffX = Math.abs(startX - endX);
    const diffY = Math.abs(startY - endY);

    let centerX;
    let centerY;

    if (diffX > diffY) {
        if (startX > endX) {
            centerX = Math.max(startX, endX) - radius;
            centerY = Math.min(startY, endY) + radius;
        } else {
            centerX = Math.min(startX, endX) + radius;
            centerY = Math.max(startY, endY) - radius;
        }
    } else {
        if (startY > endY) {
            centerX = Math.min(startX, endX) + radius;
            centerY = Math.max(startY, endY) - radius;
        } else {
            centerX = Math.max(startX, endX) - radius;
            centerY = Math.min(startY, endY) + radius;
        }
    }

    return [centerX, centerY];
}
