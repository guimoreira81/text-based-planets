class vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(Other) {
        return new vector(this.x + Other.x, this.y + Other.y);
    }
    sub(Other) {
        return new vector(this.x - Other.x, this.y - Other.y);
    }
    mul(Other) {
        if (typeof (Other) == "number") {
            return new vector(this.x * Other, this.y * Other);
        } else {
            return new vector(this.x * Other.x, this.y * Other.y);
        }
    }
    div(Other) {
        if (typeof (Other) == "number") {
            return new vector(this.x / Other, this.y / Other);
        }
    }
    Magnitude() {
        return sqrt(this.x * this.x + this.y * this.y);
    }
    Unit() {
        return this.div(this.Magnitude());
    }
    Text() {
        return "(" + this.x + ", " + this.y + ")"
    }
}

class screen {
    constructor(Size) {
        this.Size = Size
        this.Screen = []
    }
    fillScreen(Char) {
        this.Screen = []
        for (let i = 0; i < this.Size.x*this.Size.y; i++) {
            this.Screen.push(Char)
        }
    }
    drawPixel(Char, Position) {
        Position = new vector(int(Position.x), int(Position.y))
        if (Position.x >= 0 && Position.x < this.Size.x && Position.y >= 0 && Position.y < this.Size.y) {
            this.Screen[Position.y * this.Size.x + Position.x] = Char;
        }
    }
    drawText(Text, Position) {
        for (let c in Text) {
            this.drawPixel(Text[c], new vector(c * 1, 0).add(Position))
        }
    }
    drawRect(Char, Position, Size) {
        for (let x = 0; x < Size.x; x++) {
            for (let y = 0; y < Size.y; y++) {
                this.drawPixel(Char, Position.add(new vector(x, y)))
            }
        }
    }
    drawCircle(Char, Position, Diameter) {
        for (let x = 0; x < Diameter; x++) {
            for (let y = 0; y < Diameter; y++) {
                let Center = new vector(Diameter / 2, Diameter / 2);
                if (new vector(x, y).sub(Center).Magnitude() < Diameter / 2) {
                    this.drawPixel(Char, Position.add(new vector(x, y)));
                }
            }
        }
    }
    refresh() {
        background("black")
        for (let y = 0; y < this.Size.y; y++) {
            let Text = ""
            for (let x = 0; x < this.Size.x; x++) {
                Text += this.Screen[y * this.Size.x + x]
            }
            fill("white")
            textFont("monospace");
            textSize(height/this.Size.y)
            //console.log(this.Size.y)
            //console.log(height/this.Size.y)
            textAlign(CENTER, CENTER)
            text(Text, width * 0.5, height / this.Size.y * (y + 0.5))
        }
    }
}

//Tamanho da fonte: 40/window.innerHeight
/*
Quantos tamanhos de fonte cabem na largura da tela? 
fonte*x = tela.x
fonte = telaX/x
fonte = f
tela.x = t
resultado = x

xf = t
x = t/f

*/
//console.log(window.innerHeight/40)
let ScreenSize = new vector(Math.floor(window.innerWidth/(window.innerHeight/40)), 40)
let Screen = new screen(ScreenSize)

function setup() {
    createCanvas(window.innerWidth, window.innerHeight)
}

let Objects = []

class object {
    constructor(Name, Position, Color) {
        this.Name = Name
        this.Position = Position
        this.Velocity = new vector(0, 0)
        this.Diameter = random(5, 10)
        this.Mass = this.Diameter
        this.Color = Color
        this.Shape = "Circle"
        this.Paths = []
        Objects.push(this)
    }
}

Camera = [
    Position = new vector(0, 0),
    Velocity = new vector(0, 10),
    Zoom = 1
]
Camera.Position = new vector(0, 0)
Camera.Velocity = new vector(0, 10)
Camera.Zoom = 1

let Buttons = []
class button {
    constructor(Name, Position, Size, Char, Text = "") {
        this.Name = Name
        this.Position = Position
        this.Size = Size
        this.Char = Char
        this.Text = Text
        this.Visible = true
        Buttons.push(this)
    }
}

let WalkButtonSize = new vector(0.12, 0.12)
let DownButton = new button("Down", new vector(0.15, 0.8), WalkButtonSize, "v")
let UpButton = new button("Up", new vector(0.15, 0.65), WalkButtonSize, "^")
let LeftButton = new button("Left", new vector(0, 0.8), WalkButtonSize, "<")
let RightButton = new button("Right", new vector(0.3, 0.8), WalkButtonSize, ">")
let AddZoomButton = new button("AddZoom", new vector(0.9, 0.05), new vector(0.1, 0.1), "+")
let DecreaseZoomButton = new button("DecreaseZoom", new vector(0.75, 0.05), new vector(0.1, 0.1), "-")

let CreateButton = new button("CreateButton", new vector(0.8, 0.6), new vector(0.25, 0.1), "-", "Criar")
let DestroyButton = new button("DestroyButton", new vector(0.8, 0.85), new vector(0.25, 0.1), "-", "Destruir")
let DetailsButton = new button("DetailsButton", new vector(0.8, 0.725), new vector(0.25, 0.1), "-", "Detalhes")
let SetReference = new button("SetReference", new vector(0.5, .725), new vector(0.3, 0.075), "-", "Colocar Referência")
SetReference.Visible = false
let DetailsName = new button("DetailsName", new vector(0.65, 0.625), new vector(0, 0), "-", "Nome: Undefined")
DetailsName.Visible = false
let ZoomText = new button("ZoomText", new vector(0.875, 0.025), new vector(0, 0), " ", "Zoom")
let ShowPathButton = new button("ShowPath", new vector(0.11, 0.05), new vector(0.25, 0.075), "#", "Mostrar Caminho")
let ShowPath = true

let TimeScale = 3
let Selected = undefined
let Referenced = false
function SetSelected(selected) {
    if (selected != Selected) {
        Referenced = false
    }
    Selected = selected
    if (Selected == undefined) {
        DetailsName.Visible = false
        SetReference.Visible = false
    } else {
        DetailsName.Visible = true
        SetReference.Visible = true
        DetailsName.Text = "Nome: " + Selected.Name
        SetReference.Text = "Colocar Referência"
    }
}

function ScreenToWorldPos(Position) {
    Position = Position.sub(new vector(width / 2, height / 2))
    console.log(Position.Text())
    return new vector((Position.x / width * Screen.Size.x) / Camera.Zoom - Camera.Position.x, (Position.y / height * Screen.Size.y) / Camera.Zoom - Camera.Position.y)
}

let Mode = "Create"
let CreatingCelestialBody = [new vector(0, 0), false]

let Colors = ["A", "#", "O", "@"]
let TouchOnScreen = true

function mouseDown(TouchOnScreen, Button) {
    let Position = ScreenToWorldPos(new vector(mouseX, mouseY))
    if (TouchOnScreen) {
        if (Mode == "Create") {
            CreatingCelestialBody = [Position, true]
        }
        if (Mode == "Destroy") {
            for (let i in Objects) {
                let Object = Objects[i]
                if (Object.Position.sub(Position).Magnitude() < Object.Diameter / 2) {
                    Objects.splice(i, 1)
                }
            }
        }
        if (Mode == "Details") {
            SetSelected(undefined)
            for (let i in Objects) {
                let Object = Objects[i]
                if ((Object.Position.sub(Position)).Magnitude() < Object.Diameter / 2) {
                    SetSelected(Object)
                }
            }
        }
    }

    if (Button != undefined) {
        if (Button.Name == "CreateButton") {
            Mode = "Create"
            refreshModeButtons(CreateButton)
        }
        if (Button.Name == "DestroyButton") {
            Mode = "Destroy"
            refreshModeButtons(DestroyButton)
        }
        if (Button.Name == "DetailsButton") {
            Mode = "Details"
            refreshModeButtons(DetailsButton)
        }
        if (Button.Name == "SetReference") {
            if (Referenced) {
                Referenced = false
                Button.Text = "Colocar Referência"
            } else {
                Referenced = true
                Button.Text = "Remover Referência"
            }
        }
        if (Button.Name == "ShowPath") {
            if (ShowPath) {
                ShowPath = false
                Button.Char = "="
            } else {
                ShowPath = true
                Button.Char = "#"
            }
        }
    }
}

function mouseUp(TouchOnScreen, Button) {
    let Position = ScreenToWorldPos(new vector(mouseX, mouseY));
    if (CreatingCelestialBody[1] == true && TouchOnScreen) {
        let Object = new object(Objects.length.toString(), CreatingCelestialBody[0]);
        Object.Velocity = Position.sub(CreatingCelestialBody[0]).mul(0.5 / TimeScale);
        Object.Mass = 3.14 * (Object.Diameter / 2) ** 2
        Object.Color = 0
        CreatingCelestialBody[1] = false
    }
}

function refreshModeButtons(BSelected) {
    CreateButton.Char = "#"
    DestroyButton.Char = "#"
    DetailsButton.Char = "#"
    CreatingCelestialBody = [new vector(0, 0), false]
    if (BSelected == DetailsButton && Selected) {
        SetReference.Visible = true

    } else {
        SetReference.Visible = false
    }
    DetailsName.Visible = SetReference.Visible
    BSelected.Char = "="
}
refreshModeButtons(CreateButton)

let LastIsPressed = false
let dt = 1 / 12
function draw() {
    Screen.fillScreen(" ")
    for (let i in Objects) {
        let Object = Objects[i]
        if (ShowPath) {
            let PathPos = Object.Position
            let CreatePath = true
            for (let i2 in Object.Paths) {
                let Path = Object.Paths[i2]
                if (Path[0] == PathPos) {
                    CreatePath = false
                }
                if (millis() - Path[1] > 5 * 1000) {
                    Object.Paths.splice(i2, 1)
                } else {
                    Screen.drawPixel("|", Path[0].add(Camera.Position).mul(Camera.Zoom).add(Screen.Size.div(2)))
                }
            }
            if (CreatePath) {
                Object.Paths.push([PathPos, millis()])
            }
        }
    }
    for (let i in Objects) {
        let Object = Objects[i]
        if (Object.Color == 0) {
            Object.Color = random(Colors)
        }
        Object.Diameter = sqrt(Object.Mass / 3.14) * 2
        let Acceleration = new vector(0, 0)
        for (let i2 in Objects) {
            let Other = Objects[i2]
            if (Object.Position.x != Other.Position.x && Object.Position.y != Other.Position.y) {
                let diff = Other.Position.sub(Object.Position)
                let Direction = diff.Unit();
                let Distance = diff.Magnitude();
                if (Distance > (Object.Diameter + Other.Diameter) / 2) {
                    Acceleration = Acceleration.add(Direction.mul(Other.Mass).div(Distance ** 2));
                } else if (Other.Mass > Object.Mass) {
                    Other.Velocity = Other.Velocity.add(Object.Velocity.sub(Other.Velocity)).div(Other.Mass / Object.Mass)
                    Other.Mass += Object.Mass
                    Objects.splice(i, 1)
                }
            }
        }
        Object.Velocity = Object.Velocity.add(Acceleration.mul(dt * TimeScale));
        //Object.Velocity = Object.Velocity.mul(1+dt*TimeScale*0.005);
        Object.Position = Object.Position.add(Object.Velocity.mul(dt * TimeScale));
        let RelativePosition = Object.Position.add(new vector(-Object.Diameter / 2, -Object.Diameter / 2)).add(Camera.Position).mul(Camera.Zoom).add(Screen.Size.div(2))
        if (Object.Shape == "Circle") {
            Screen.drawCircle(Object.Color, RelativePosition, Object.Diameter * Camera.Zoom)
            Screen.drawText("", RelativePosition);
        }
        if (Object.Shape == "Rect") {
            Screen.drawRect(Object.Color, RelativePosition, new vector(Object.Diameter * Camera.Zoom, Object.Diameter * Camera.Zoom))
        }
    }
    if (Referenced && Selected) {
        Camera.Velocity = Selected.Velocity.mul(-1)
    } else {
        Camera.Velocity = new vector(0, 0)
    }
    Camera.Position = Camera.Position.add(Camera.Velocity.mul(dt * TimeScale))
    TouchOnScreen = true
    let ButtonPressed
    for (let i in Buttons) {
        let Button = Buttons[i]
        if (Button.Visible) {
            Screen.drawRect(Button.Char, Button.Position.mul(Screen.Size), Button.Size.mul(Screen.Size))
            Screen.drawText(Button.Text, new vector(Button.Position.x + Button.Size.x / 2, Button.Position.y + Button.Size.y / 2).mul(Screen.Size).sub(new vector(Button.Text.length / 2, 0)))
        }
        let Pos = new vector(mouseX / width, mouseY / height)
        if (Button.Visible && mouseIsPressed && Pos.x > Button.Position.x && Pos.x < Button.Position.x + Button.Size.x && Pos.y > Button.Position.y && Pos.y < Button.Position.y + Button.Size.y) {
            TouchOnScreen = false
            ButtonPressed = Button
            if (Button.Name == "Up") {
                Camera.Position = Camera.Position.add(new vector(0, 10 * dt / Camera.Zoom))
            }
            if (Button.Name == "Down") {
                Camera.Position = Camera.Position.add(new vector(0, -10 * dt / Camera.Zoom))
            }
            if (Button.Name == "Left") {
                Camera.Position =
                    Camera.Position.add(new vector(10 * dt / Camera.Zoom, 0))
            }
            if (Button.Name == "Right") {
                Camera.Position = Camera.Position.add(new vector(-10 * dt / Camera.Zoom, 0))
            }
            if (Button.Name == "AddZoom") {
                Camera.Zoom *= 1 + dt * 0.5;
            }
            if (Button.Name == "DecreaseZoom") {
                Camera.Zoom *= 1 - dt * 0.5;
            }
        }
    }
    Screen.drawText("@guimo81", new vector(0, 0))
    if (LastIsPressed == false && mouseIsPressed) {
        mouseDown(TouchOnScreen, ButtonPressed)
    }
    if (LastIsPressed && mouseIsPressed == false) {
        mouseUp(TouchOnScreen, ButtonPressed)
    }
    LastIsPressed = mouseIsPressed
    Screen.refresh()
}
