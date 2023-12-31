if (window.location.href.search("quizizz.com/join/game/") == -1 && window.location.href.search("gameType=") == -1) {
}

let script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

document.head.insertAdjacentHTML('beforeend', `<style type="text/css">
correct-answer-x3Ca8B {
  color: lime !important;
}
</style>`);

class Encoding {
    static encodeRaw(t, e, o = "quizizz.com") {
        let s = 0;
        s = e ? o.charCodeAt(0) : o.charCodeAt(0) + o.charCodeAt(o.length - 1);
        let r = [];
        for (let o = 0; o < t.length; o++) {
            let n = t[o].charCodeAt(0)
                , c = e ? this.safeAdd(n, s) : this.addOffset(n, s, o, 2);
            r.push(String.fromCharCode(c))
        }
        return r.join("")
    }

    static decode(t, e = !1) {
        if (e) {
            let e = this.extractHeader(t);
            return this.decodeRaw(e, !0)
        }
        {
            let e = this.decode(this.extractHeader(t), !0)
                , o = this.extractData(t);
            return this.decodeRaw(o, !1, e)
        }
    }

    static decodeRaw(t, e, o = "quizizz.com") {
        let s = this.extractVersion(t);
        let r = 0;
        r = e ? o.charCodeAt(0) : o.charCodeAt(0) + o.charCodeAt(o.length - 1),
            r = -r;
        let n = [];
        for (let o = 0; o < t.length; o++) {
            let c = t[o].charCodeAt(0)
                , a = e ? this.safeAdd(c, r) : this.addOffset(c, r, o, s);
            n.push(String.fromCharCode(a))
        }
        return n.join("")
    }

    static addOffset(t, e, o, s) {
        return 2 === s ? this.verifyCharCode(t) ? this.safeAdd(t, o % 2 == 0 ? e : -e) : t : this.safeAdd(t, o % 2 == 0 ? e : -e)
    }

    static extractData(t) {
        let e = t.charCodeAt(t.length - 2) - 33;
        return t.slice(e, -2)
    }

    static extractHeader(t) {
        let e = t.charCodeAt(t.length - 2) - 33;
        return t.slice(0, e)
    }

    static extractVersion(t) {
        if ("string" == typeof t && t[t.length - 1]) {
            let e = parseInt(t[t.length - 1], 10);
            if (!isNaN(e))
                return e
        }
        return null
    }

    static safeAdd(t, e) {
        let o = t + e;
        return o > 65535 ? o - 65535 + 0 - 1 : o < 0 ? 65535 - (0 - o) + 1 : o
    }

    static verifyCharCode(t) {
        if ("number" == typeof t)
            return !(t >= 55296 && t <= 56319 || t >= 56320 && t <= 57343)
    }
}

function GetSetData() {
    let URL = window.location.href
        , GameType = URL.slice(URL.search("gameType=") + 9, URL.length)
        , prevConx = localStorage.getItem("previousContext")
        , parsedConx = JSON.parse(prevConx)
        , encodedRoomHash = parsedConx.game.roomHash
        , roomHash = Encoding.decode(encodedRoomHash.split("-")[1])
        , data = {
        roomHash: roomHash,
        type: GameType
    };

    let xhttp = new XMLHttpRequest
    xhttp.open("POST", "https://game.quizizz.com/play-api/v3/getQuestions", false)
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(data))
    return JSON.parse(xhttp.responseText)
}

function GetAnswer(Question) {
    switch (Question.structure.kind) {
        case "BLANK":
            // Text Response, we have no need for image detection in answers
            let ToRespond = []
            for (let i = 0; i < Question.structure.options.length; i++) {
                ToRespond.push(Question.structure.options[i].text)
            }
            return ToRespond;
        case "MSQ":
            // Multiple Choice
            let Answers = Encoding.decode(Question.structure.answer)
            Answers = JSON.parse(Answers)
            let TextArray = []
            for (let i = 0; i < Answers.length; i++) {
                if (Answers[i].text == "") {
                    TextArray.push(Question.structure.options[Answers[i]].media[0].url)
                } else {
                    TextArray.push(Question.structure.options[Answers[i]].text)
                }
            }
            return TextArray;
        case "MCQ":
            // Single Choice
            let AnswerNum = Encoding.decode(Question.structure.answer)
            let Answer = Question.structure.options[AnswerNum].text
            if (Answer == "") {
                Answer = Question.structure.options[AnswerNum].media[0].url
            }
            return Answer;
    }
}

function GetQuestion(Set) {
    for (let v of Object.keys(Set.questions)) {
        v = Set.questions[v]
        switch (GetQuestionType()) {
            case "Both":
                let BothSRC = document.getElementsByClassName("question-media")[0].children[0].src
                BothSRC = BothSRC.slice(0, BothSRC.search("/?w=") - 1)
                if (v.structure.query.media[0]) {
                    if (v.structure.query.media[0].url == BothSRC) {
                        let BothQuestion = document.getElementsByClassName("question-text")[0].children[0].children[0].innerHTML
                        if (Fix(BothQuestion) == Fix(v.structure.query.text)) {
                            return (v)
                        }
                    }
                }
                break
            case "Media":
                let CurrentSRC = document.getElementsByClassName("question-media")[0].children[0].src
                CurrentSRC = CurrentSRC.slice(0, CurrentSRC.search("/?w=") - 1)
                if (v.structure.query.media[0]) {
                    if (v.structure.query.media[0].url == CurrentSRC) {
                        return (v)
                    }
                }
                break
            case "Text":
                let ToSearchA = document.getElementsByClassName("question-text")[0].children[0].children[0].innerHTML
                let ToSearchB = v.structure.query.text
                ToSearchB = ToSearchB
                ToSearchA = ToSearchA
                if (Fix(ToSearchA) == Fix(ToSearchB)) {
                    return (v)
                }
                break
        }
    }
    return "Error: No question found"
}

function GetQuestionType() {
    if (document.getElementsByClassName("question-media")[0]) {
        // Media was detected, check if text is too
        if (document.getElementsByClassName("question-text")[0]) {
            // Detected text aswell, send it to the onchanged
            return ("Both")
        } else {
            // Failed to detect text aswell, Media is all that we need to send
            return ("Media")
        }
    } else {
        // Media wasn't detected, no need to check if text was because it has to be
        return ("Text")
    }
}

let CurrentQuestionNum = ""
let LastRedemption

function Fix(s) {
    sEnd = s.lastIndexOf("&nbsp;")
    if (sEnd == s.length - 6) {
        s = s.substring(0, sEnd)
    }
    s = s.replace(/&nbsp;/g, " ")
    s = s.replace(/&#8203;/g, "‍")
    s = jQuery('<div>').html(String(s))[0].innerHTML
    s = s.replace(/\s+/g, ' ')
    return s
}

function QuestionChangedLoop() {
    setTimeout(function() {
        let NewNum = document.getElementsByClassName("current-question")[0]
        let RedemptionQues = document.getElementsByClassName("redemption-marker")[0]
        if (NewNum) {
            if (NewNum.innerHTML != CurrentQuestionNum) {
                setTimeout(function() {
                    if (document.getElementsByClassName("typed-option-input")[0]) {
                        let Set = GetSetData()
                        let Question = GetQuestion(Set)
                        if (Question == "Error: No question found") {
                            alert("An error occurred, This should never happen. Please DM East_Arctica#9238 with your quiz link.")
                        } else {
                            let Answer = GetAnswer(Question)
                            if (Array.isArray(Answer)) {
                                // We are on a question with multiple answers
                                let ToShow = ""
                                for (let x = 0; x < Answer.length; x++) {
                                    if (ToShow == "") {
                                        ToShow = Answer[x]
                                    } else {
                                        ToShow = ToShow + " | " + Answer[x]
                                    }
                                }
                                let ToShowNew = "Press Ctrl+C to copy (Answers are seperated by ' | ')"
                                prompt(ToShowNew, ToShow)
                            } else {
                                let NewAnswer = "Press Ctrl+C to copy."
                                prompt(NewAnswer, Answer);
                            }
                        }
                    } else {
                        let Choices = document.getElementsByClassName("options-container")[0].children[0].children
                        for (let i = 0; i < Choices.length; i++) {
                            if (!Choices[i].classList.contains("emoji")) {
                                let Choice = Choices[i].children[0].children[0].children[0].children[0]
                                let Set = GetSetData()
                                let Question = GetQuestion(Set)
                                if (Question === "Error: No question found") {
                                    alert("Failed to find question! This is a weird issue I don't understand, you will just have to answer this question legit for now.")
                                } else {
                                    let Answer = GetAnswer(Question)
                                    if (Array.isArray(Answer)) {
                                        // We are on a question with multiple answers
                                        for (let x = 0; x < Answer.length; x++) {
                                            if (Fix(Choice.innerHTML) == Answer[x]) {
                                                Choice.innerHTML = "<correct-answer-x3Ca8B><u>" + Choice.innerHTML + "</u></correct-answer-x3Ca8B>"
                                            }
                                        }
                                    } else {
                                        if (Fix(Choice.innerHTML) == Answer) {
                                            Choice.innerHTML = "<correct-answer-x3Ca8B><u>" + Choice.innerHTML + "</u></correct-answer-x3Ca8B>"
                                        } else if (Choice.style.backgroundImage.slice(5, Choice.style.backgroundImage.length - 2).slice(0, Choice.style.backgroundImage.slice(5, Choice.style.backgroundImage.length - 2).search("/?w=") - 1) == GetAnswer(GetQuestion(GetSetData()))) {
                                            Choice.innerHTML = "<correct-answer-x3Ca8B><u>Correct Answer</u></correct-answer-x3Ca8B>"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, 1000)
                CurrentQuestionNum = NewNum.innerHTML
            }
        } else if (RedemptionQues) {
            if (LastRedemption != GetQuestion(GetSetData())) {
                let Choices = document.getElementsByClassName("options-container")[0].children[0].children
                for (let i = 0; i < Choices.length; i++) {
                    if (!Choices[i].classList.contains("emoji")) {
                        let Choice = Choices[i].children[0].children[0].children[0].children[0]
                        if (Fix(Choice.innerHTML) == GetAnswer(GetQuestion(GetSetData()))) {
                            Choice.innerHTML = "<correct-answer-x3Ca8B><u>" + Choice.innerHTML + "</u></correct-answer-x3Ca8B>"
                        }
                    }
                }
                LastRedemption = GetQuestion(GetSetData())
            }
        }
        QuestionChangedLoop()
    }, 100)
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
async function wait() {
    await sleep(1000);
    QuestionChangedLoop();
}
wait()
