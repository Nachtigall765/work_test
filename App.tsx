import { useRef, useState } from "react";
import "./App.css";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions
} from "chart.js";
import { Radar } from "react-chartjs-2";
import jsPDF from "jspdf";
import  html2canvas from "html2canvas";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type ScoreKey =
  | "logic"
  | "empathy"
  | "challenge"
  | "careful"
  | "coop"
  | "lead"
  | "independent"
  | "honesty"
  | "stable";

type Scores = Partial<Record<ScoreKey, number>>;

type QuestionOption = {
  text: string;
  scores: Scores;
};

type Question = {
  id: number;
  text: string;
  source: string;
  options: QuestionOption[];
};

type TotalScores = Record<ScoreKey, number>;

type DiagnosisType = {
  name: string;
  score: number;
  description: string;
};

type DiagnosisResult = {
  totals: TotalScores;
  topType: DiagnosisType;
  secondType: DiagnosisType;
  thinkingStyle: string;
  recommendedDepartment: string;
};

const questions: Question[]= [
  {
    id: 1,
    text: "暴走するトロッコがこのまま進むと5人が犠牲になる。進路を変えると1人だけが犠牲になる。あなたはどうする？",
    source: "トロッコ問題",
    options: [
      { text: "A. 5人を救うために進路を変える", scores: { logic: 2, challenge: 1 } },
      { text: "B. 他の方法がないか最後まで考える", scores: { careful: 2, logic: 1 } },
      { text: "C. 自分が犠牲を選ぶ判断は避ける", scores: { empathy: 2, careful: 1 } },
    ],
  },
  {
    id: 2,
    text: "長年使われてきた装置の部品をすべて新しいものに交換した場合、それは元と同じものだと思う？",
    source: "テセウスの船",
    options: [
      { text: "A. 同じもの。役割や機能が続いているから", scores: { logic: 2, stable: 1 } },
      { text: "B. 状況による。定義次第で変わる", scores: { careful: 2, logic: 1 } },
      { text: "C. 別のもの。元の構成が変わっているから", scores: { independent: 2, challenge: 1 } },
    ],
  },
  {
    id: 3,
    text: "相手が知らない情報を自分だけ知っているとき、相手の立場に立って行動を予測するのは得意？",
    source: "アンとサリー問題 / 誤信念課題",
    options: [
      { text: "A. 得意。相手目線で考えやすい", scores: { empathy: 2, coop: 1 } },
      { text: "B. 事実関係から整理して考える", scores: { logic: 2, careful: 1 } },
      { text: "C. 状況によってかなり変わる", scores: { careful: 2, stable: 1 } },
    ],
  },
  {
    id: 4,
    text: "相手を信じて協力すれば両方に利益があるが、裏切れば自分だけ得をするかもしれない。あなたは？",
    source: "囚人のジレンマ",
    options: [
      { text: "A. まずは協力を選ぶ", scores: { coop: 2, empathy: 1 } },
      { text: "B. 相手や状況を見て判断する", scores: { logic: 2, careful: 1 } },
      { text: "C. 自分を守る選択を優先する", scores: { independent: 2, challenge: 1 } },
    ],
  },
  {
    id: 5,
    text: "限られた資源を複数人に配るなら、何を基準にする？",
    source: "ライフボート問題 / 資源配分問題",
    options: [
      { text: "A. 効果が最大になる配分", scores: { logic: 2, lead: 1 } },
      { text: "B. できるだけ公平な配分", scores: { honesty: 2, stable: 1 } },
      { text: "C. 困っている人を優先する", scores: { empathy: 2, coop: 1 } },
    ],
  },
  {
    id: 6,
    text: "誰にも知られず、ほぼ不利益も出ない小さなルール違反ができるとしても、あなたは？",
    source: "透明人間の指輪",
    options: [
      { text: "A. しない。見られていなくても同じ", scores: { honesty: 2, stable: 1 } },
      { text: "B. 内容によって考える", scores: { careful: 2, logic: 1 } },
      { text: "C. 問題が小さいなら許容することもある", scores: { independent: 2, challenge: 1 } },
    ],
  },
  {
    id: 7,
    text: "今すぐ小さな利益を得るか、少し待って大きな利益を得るか選べるとき、あなたは？",
    source: "マシュマロ実験",
    options: [
      { text: "A. 待って大きな利益を取る", scores: { careful: 2, stable: 1 } },
      { text: "B. 状況によって選ぶ", scores: { logic: 2, careful: 1 } },
      { text: "C. 今すぐ確実な利益を取る", scores: { challenge: 2, independent: 1 } },
    ],
  },
  {
    id: 8,
    text: "高い精度で判断するAIがあっても、重要な判断の最終責任は誰が持つべきだと思う？",
    source: "AI倫理問題",
    options: [
      { text: "A. AIを活用しつつ、人が最終判断する", scores: { logic: 2, careful: 1 } },
      { text: "B. 基本は人が責任を持つべき", scores: { honesty: 2, empathy: 1 } },
      { text: "C. 条件が整えばAIにかなり任せてもよい", scores: { challenge: 2, independent: 1 } },
    ],
  },
  {
    id: 9,
    text: "チームが混乱していて誰も動けないとき、あなたはどうする？",
    source: "リーダーシップの仮想課題",
    options: [
      { text: "A. 自分が前に出て方向を示す", scores: { lead: 2, challenge: 1 } },
      { text: "B. 状況を整理して役割を決める", scores: { logic: 2, coop: 1 } },
      { text: "C. みんなの意見を聞いて空気を整える", scores: { empathy: 2, coop: 1 } },
    ],
  },
  {
    id: 10,
    text: "全員が賛成しているが、自分だけ違和感がある案に出会ったらどうする？",
    source: "集団同調 / 少数派の異議申し立て",
    options: [
      { text: "A. はっきり異議を出す", scores: { honesty: 2, lead: 1 } },
      { text: "B. 根拠を整理して冷静に伝える", scores: { logic: 2, careful: 1 } },
      { text: "C. いったん全体に合わせる", scores: { coop: 2, stable: 1 } },
    ],
  },
];

const initialAnswers: Record<number, string> = {};
questions.forEach((q: Question) => {
  initialAnswers[q.id] = "";
});

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode: "intro" | "profile" = searchParams.get("start") === "1" ? "profile" : "intro";

  const [mode, setMode] = useState<"intro" | "profile" | "question" | "result">(initialMode);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [answers, setAnswers] = useState<Record<number,string>>(initialAnswers);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion: Question = questions[currentQuestionIndex] as Question;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleChange = (questionId: number, value: string) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const goToProfile = () => {
    setMode("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startDiagnosis = () => {
    if (name.trim() === "" || job.trim() === "") {
      alert("名前と職業を入力してください。");
      return;
    }

    setMode("question");
    setCurrentQuestionIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (answers[currentQuestion.id] === "") {
      alert("この質問に回答してください。");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const calculateResult = () => {
    const unanswered = questions.some((q) => answers[q.id] === "");
    if (unanswered) {
      alert("すべての質問に回答してください。");
      return;
    }

    const total: TotalScores = {
      logic: 0,
      empathy: 0,
      challenge: 0,
      careful: 0,
      coop: 0,
      lead: 0,
      independent: 0,
      honesty: 0,
      stable: 0,
    };

    questions.forEach((q) => {
      const selectedIndex = Number(answers[q.id]);
      const selectedOption = q.options[selectedIndex];
      if (!selectedOption) return;

      const scores = selectedOption.scores;

      (Object.keys(scores) as ScoreKey[]).forEach((key) => {
        total[key] += scores[key] ?? 0;
      });
    });

    const personalityTypes = [
      {
        name: "論理分析型",
        score: total.logic + total.careful,
        description:
          "情報を整理し、筋道を立てて判断するのが得意なタイプです。根拠を重視し、落ち着いて進めやすい傾向があります。",
      },
      {
        name: "共感協調型",
        score: total.empathy + total.coop,
        description:
          "人の気持ちや関係性を大切にし、周囲と協力して物事を進めるのが得意なタイプです。",
      },
      {
        name: "挑戦主導型",
        score: total.challenge + total.lead,
        description:
          "決断や行動が早く、新しいことにも前向きなタイプです。先頭に立って進める場面に強みがあります。",
      },
      {
        name: "慎重安定型",
        score: total.careful + total.stable,
        description:
          "リスクを見極めて堅実に進めるタイプです。安定感があり、大きな失敗を避けやすい傾向があります。",
      },
      {
        name: "自立実行型",
        score: total.independent + total.challenge,
        description:
          "自分で判断して試行錯誤しながら進めるのが得意なタイプです。個人での遂行力が高めです。",
      },
    ];

    personalityTypes.sort((a, b) => b.score - a.score);

    const topType = personalityTypes[0] as DiagnosisType;
    const secondType = personalityTypes[1] as DiagnosisType;

    let thinkingStyle = "";
    if (total.logic >= total.empathy && total.logic >= total.challenge) {
      thinkingStyle =
        "分析重視。事実や根拠をもとに判断しやすいタイプです。";
    } else if (
      total.empathy >= total.logic &&
      total.empathy >= total.challenge
    ) {
      thinkingStyle =
        "関係性重視。人への影響や空気感を考えて判断しやすいタイプです。";
    } else {
      thinkingStyle =
        "行動重視。まず動いて確かめる発想を取りやすいタイプです。";
    }

    let recommendedDepartment = "";
    if (topType.name === "論理分析型") {
      recommendedDepartment = "急性期寄り";
    } else if (topType.name === "共感協調型") {
      recommendedDepartment = "慢性期寄り";
    } else if (topType.name === "挑戦主導型") {
      recommendedDepartment = "急性期寄り";
    } else if (topType.name === "慎重安定型") {
      recommendedDepartment = "慢性期寄り";
    } else {
      recommendedDepartment = "どちらにも適応可能";
    }

    setResult({
      totals: total,
      topType,
      secondType,
      thinkingStyle,
      recommendedDepartment,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setMode("intro");
    setCurrentQuestionIndex(0);
    setName("");
    setJob("");
    setAnswers(initialAnswers);
    setResult(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("start");
    window.history.replaceState({}, "", url.toString());

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const printResult = () => {
    window.print();
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;

    const canvas = await html2canvas(resultRef.current as HTMLElement,
       {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const usableWidth = pdfWidth - margin * 2;
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(`${name || "diagnosis"}_result.pdf`);
  };

  const chartData = result
    ? {
      labels: [
        "logic",
        "empathy",
        "challenge",
        "careful",
        "coop",
        "lead",
        "independent",
        "honesty",
        "stable",
      ],
      datasets: [
        {
          label: "診断スコア",
          data: [
            result.totals.logic,
            result.totals.empathy,
            result.totals.challenge,
            result.totals.careful,
            result.totals.coop,
            result.totals.lead,
            result.totals.independent,
            result.totals.honesty,
            result.totals.stable,
          ],
          backgroundColor: "rgba(209, 107, 140, 0.25)",
          borderColor: "rgba(209, 107, 140, 1)",
          pointBackgroundColor: "#ff69b4",
          pointRadius: 7,
          pointHoverRadius: 10,

          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(209, 107, 140, 1)",
          borderWidth: 3,
        },
      ],
    }
    : null;

  const chartOptions: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      r: {
        min: 0,
        max: 10,

        pointLabels: {
          color: (context) => {
          const values = [
            result?.totals.logic ?? 0,
            result?.totals.empathy ?? 0,
            result?.totals.challenge ?? 0,
            result?.totals.careful ?? 0,
            result?.totals.coop ?? 0,
            result?.totals.lead ?? 0,
            result?.totals.independent ?? 0,
            result?.totals.honesty ?? 0,
            result?.totals.stable ?? 0,
          ];

          const score = values[context.index] ?? 0;

          if (score >= 7) return "#f7c948";
          if (score <= 3) return "#6ca0dc";
          return "#777";
        },
          font: {
            size: 16 as const,
            weight: 700 as const,
          },
        },

        ticks: {
          stepSize: 2,
        },
      },
    },
  };

  if (result) {
    return (
      <div className="app">
        <div className="resultBox" ref={resultRef}>
          <h1>診断結果</h1>

          <div className="resultContent">
            <div className="chartBox">
              <p className="chartTitle">診断スコア</p>
              <Radar data={chartData!} options={chartOptions} />
            </div>

            <div className="resultTextBox">
              <p>あなたの主なタイプ</p>
              <strong>{result.topType.name}</strong>

              <p>次に強い傾向</p>
              <strong>{result.secondType.name}</strong>

              <p>思考傾向</p>
              <span>{result.thinkingStyle}</span>

              <p>推奨配置</p>
              <span>{result.recommendedDepartment}</span>
            </div>
          </div>

          <div className="resultButtons">
            <button onClick={printResult}>印刷</button>
            <button onClick={downloadPDF}>PDF保存</button>
            <button onClick={resetForm}>TOPに戻る</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "intro") {
    return (
      <div className="app">
        <div className="phoneFrame">
          <h1>性格・思考傾向診断</h1>
          <p className="introText">
            思考実験ベースの10問三択で、
            <br />
            性格傾向・思考スタイル・適性部署を
            <br />
            簡易診断します。
          </p>

          <div className="buttonArea single">
            <button onClick={goToProfile}>診断</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "profile") {
    return (
      <div className="app">
        <div className="phoneFrame">
          <h1>基本情報入力</h1>

          <div className="profileBox">
            <label>
              名前
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label>
              職業
              <input
                type="text"
                value={job}
                onChange={(e) => setJob(e.target.value)}
              />
            </label>
          </div>

          <div className="buttonArea">
            <button onClick={resetForm}>戻る</button>
            <button onClick={startDiagnosis}>スタート</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="phoneFrame">
        <div className="questionHeader">
          質問{currentQuestionIndex + 1} / {questions.length}
        </div>

        <div className="questionBox">
          <p>{currentQuestion.text}</p>

          <div className="options">
            {currentQuestion?.options.map((option:QuestionOption, index) => (
              <label key={index} className="optionLabel">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={answers[currentQuestion.id] === String(index)}
                  onChange={(e) =>
                    handleChange(currentQuestion.id, e.target.value)
                  }
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="buttonArea">
          <button onClick={goPrev} disabled={currentQuestionIndex === 0}>
            戻る
          </button>

          {isLastQuestion ? (
            <button className="diagnosisButton" onClick={calculateResult}>
              結果
            </button>
          ) : (
            <button onClick={goNext}>次へ</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;