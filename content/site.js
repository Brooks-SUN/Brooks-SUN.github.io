// Shared website copy. The complete paper list lives in publications.js.
// Maintenance guide: docs/甲方维护说明.md
export const siteDetails = {
  team: {
    name: "Multi-Agent Cognition and Collaboration Team",
    // Chinese name and research phrases remain editable demonstration copy.
    titleLines: ["多智能体认知", "与协同团队"],
    englishName: "Multi-Agent Cognition and Collaboration Team",
    researchDirections: ["多智能体系统", "大模型压缩与微调", "边缘智能"],
    acronym: "MACC",
    markLabel: "Multi-Agent Cognition and Collaboration",
    summary:
      "We investigate how multiple agents perceive, reason, and coordinate to build reliable multi-agent systems across dynamic, distributed computing environments.",
    recruitment: {
      text: "本团队专注多智能体认知与协同前沿研究，诚邀志同道合的同学一起探索智能未来！",
      href: "sunchuan@cqnu.edu.cn"
    }
  },
  contact: {
    isExample: true,
    email: "sunchuan@cqnu.edu.cn",
    // phone: "+86-15023479210",
    office: "重庆师范大学 · 大学城校区 致用楼 505B 办公室",
    filing: { text: "", href: "" }
  },
  // Reorder these objects to reorder both navigation and body sections. Home stays first.
  navigation: [
    { id: "home", label: "Home" },
    { id: "members", label: "Members" },
    { id: "publications", label: "Publications" },
    { id: "projects", label: "Projects" },
    { id: "patents", label: "Systems" },
    { id: "awards", label: "Awards" }
  ],
  news: [
    {
      date: "2025-08-30",
      title: "TrustFUL's PhD student Alysa Tan joins SG100 Women in Tech 2025.",
      source: "CCDS News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/from-research-to-community-impact--ccds-phd-researcher-alysa-tan-joins-sg100-women-in-tech-2025"
    },
    {
      date: "2025-03-07",
      title: "TrustFUL's paper won the Innovative Application of AI Award from AAAI in 2025.",
      source: "CCDS News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/ccds-wins-prestigious-ai-award-for-revolutionising-medical-quality-control"
    },
    {
      date: "2024-09-30",
      title: "TrustFUL faculty members were listed in Stanford University's Top 2% Scientists' Study (2024).",
      source: "CCDS News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/38-ccds-faculty-listed-in-stanford-university's-top-2-scientists-study-(2024)"
    },
    {
      date: "2024-02-28",
      title: "TrustFUL's papers won three Innovative Application of AI Awards from AAAI in 2024.",
      source: "SCSE News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/three-innovative-application-of-ai-awards-from-aaai-2024"
    },
    {
      date: "2023-05-24",
      title: "The FATE open-source academic committee was formally launched to strengthen industry-academia collaboration.",
      source: "FATE Open Source Community",
      href: "https://mp.weixin.qq.com/s?__biz=MzkyNjI3NjEwOA==&mid=2247504008&idx=1&sn=214da74f4df5b3f32f082820cba57061&chksm=c23b5febf54cd6fdc9b814a8f331ca36bae60db5b65254d8ccd87e451c2e80d9aa00eb9d6e1d&mpshare=1&scene=2&srcid=0524eWmyoG7ApvZc5hssDlPY&sharer_sharetime=1684918664042&sharer_shareid=1f4cad3e6e5bb1c6abd54862fa308b1a#rd"
    },
    {
      date: "2023-02-28",
      title: "NAP Yu Han was conferred the JCI Ten Outstanding Young Persons of Singapore Award 2022.",
      source: "SCSE News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/nap-yu-han-conferred-the-jci-ten-outstanding-young-persons-(toyp)-of-singapore-(scientific-technological-development)-award-2022"
    },
    {
      date: "2023-02-23",
      title: "Prof Dusit Niyato was appointed to a named chair professorship.",
      source: "SCSE News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/appointment-to-named-chair-professorship"
    },
    {
      date: "2023-02-16",
      title: "TrustFUL's paper won the Innovative Application of AI Award from AAAI in 2023.",
      source: "SCSE News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/scse-s-paper-won-the-innovative-application-of-ai-award-from-aaai"
    },
    {
      date: "2023-01-05",
      title: "TrustFUL faculty members were listed in Stanford University's Top 2% Scientists' Study (2022).",
      source: "SCSE News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/31-scse-faculty-listed-in-stanford-university's-top-2-scientists-study-(2022)"
    },
    {
      date: "2022-07-26",
      title: "TrustFUL's paper won the ACM SIGSOFT Distinguished Paper Award at ISSTA 2022.",
      source: "SCSE News, NTU, Singapore",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/two-acm-sigsoft-distinguished-paper-awards-at-issta-2022"
    }
  ],
  memberGroups: [
    { id: "teachers", label: "Teachers", color: "#b7d7bd" },
    { id: "collaborators", label: "Collaborators", color: "#dccb9d" },
    { id: "students", label: "Students", color: "#b4ccdf" }
  ],
  membersNotice: "示例成员名单 · 人像为生成样张，非真实团队成员。",
  members: [
    {
      name: "孙川", initials: "SC", group: "teachers",
      role: "讲师", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：多智能体系统、边缘智能."
    },
    {
      name: "王超", initials: "WC", group: "teachers",
      role: "副教授", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：自然语言处理、大语言模型."
    },
    {
      name: "肖颗", initials: "XK", group: "teachers",
      role: "讲师", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：车联网、移动计算."
    },
    {
      name: "孙松", initials: "SS", group: "teachers",
      role: "讲师", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：车联网、移动计算."
    },
    {
      name: "郭桃林", initials: "GTL", group: "collaborators",
      role: "讲师", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：隐私保护、差分隐私."
    },
    {
      name: "彭顺顺", initials: "PSS", group: "collaborators",
      role: "讲师", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：隐私保护、差分隐私."
    },
    {
      name: "高丽萍", initials: "GLP", group: "collaborators",
      role: "讲师", image: "./assets/portraits/sample-researcher.png",
      bio: "研究方向：路线规划、城市交通大数据分析."
    },
    {
      name: "Yue Zhao", initials: "YZ", group: "collaborators",
      role: "Research Partner", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    },
    {
      name: "Kai Sun", initials: "KS", group: "collaborators",
      role: "Research Partner", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    },
    {
      name: "An Wu", initials: "AW", group: "collaborators",
      role: "Research Partner", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    },
    {
      name: "Yu Zhang", initials: "YZ", group: "students",
      role: "Graduate Student", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    },
    {
      name: "Qing Liu", initials: "QL", group: "students",
      role: "Graduate Student", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    },
    {
      name: "Tao He", initials: "TH", group: "students",
      role: "Graduate Student", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    },
    {
      name: "Ran Ma", initials: "RM", group: "students",
      role: "Graduate Student", image: "./assets/portraits/sample-researcher.png",
      bio: "Research interests include multi-agent learning and collaborative intelligence."
    }
  ],
  projects: [
    {
      title: "AnomSeer: Reinforcing multimodal LLMs to reason for time-series anomaly detection",
      meta: "Multimodal LLMs / Time Series / ICML 2026",
      summary: "A multimodal anomaly analysis framework that couples detection, localization, and explanation through grounded reasoning traces.",
      href: "https://trustful.federated-learning.org/projects.html"
    },
    {
      title: "Federated domain generalization for time-series classification via dynamics-to-domain generation",
      meta: "Federated Learning / Time Series / KDD 2026",
      summary: "A federated domain generalization method that expands sequence diversity from latent dynamics without sharing raw data.",
      href: "https://trustful.federated-learning.org/projects.html"
    },
    {
      title: "FedDiG: Frequency-guided diffusion diversity for generalizable federated time series classification",
      meta: "Federated Learning / Diffusion / WWW 2026",
      summary: "A diffusion-based approach that synthesizes diverse spectral patterns to strengthen federated time-series classification under domain shift.",
      href: "https://dl.acm.org/doi/10.1145/3774904.3792329"
    },
    {
      title: "Federated nonlinear causal discovery via divide-and-conquer learning",
      meta: "Causal Discovery / Federated Learning / KDD 2026",
      summary: "A divide-and-conquer framework for nonlinear federated causal discovery that reduces error propagation through neighborhood-level decomposition.",
      href: "https://trustful.federated-learning.org/projects.html"
    },
    {
      title: "A black-box optimization-based bidding strategy for data consumers in auction-based federated learning",
      meta: "Auction-based FL / Optimization / KDD 2026",
      summary: "A budget-aware bidding strategy that frames auction-based federated learning as a black-box optimization problem.",
      href: "https://trustful.federated-learning.org/projects.html"
    },
    {
      title: "TextResNet: Decoupling and routing optimization signals in compound AI systems via deep residual tuning",
      meta: "Foundation Models / Multi-Agent Systems / ICML 2026",
      summary: "A compound-AI systems project that routes optimization signals through additive semantic deltas and residual textual tuning.",
      href: "https://github.com/JeanDiable/TextResNet"
    }
  ],
  patents: [
    {
      title: "Federated Learning Playground",
      meta: "Interactive Platform / Federated Learning",
      summary: "An interactive environment for demonstrating distributed model training, client participation, and collaborative optimization under realistic workflows.",
      href: "https://trustful.federated-learning.org/projects.html"
    },
    {
      title: "FedVision: An online visual object detection platform powered by federated learning",
      meta: "Applied Vision System / Platform Prototype",
      summary: "A user-facing detection platform that translates federated vision research into an operational AI system.",
      href: "https://trustful.federated-learning.org/projects.html"
    },
    {
      title: "FLAS: A platform for studying attacks on federated learning",
      meta: "Security Tooling / Federated Learning",
      summary: "A security-oriented environment for studying attacks, stress-testing federated pipelines, and validating defensive strategies.",
      href: "https://link.springer.com/chapter/10.1007/978-3-031-05061-9_12"
    },
    {
      title: "IBCA: An intelligent platform for social insurance benefit qualification status assessment",
      meta: "Applied Assessment System / Public Service AI",
      summary: "An intelligent assessment system showing how research methods can be operationalized in a real public-service workflow.",
      href: "https://ojs.aaai.org/index.php/AAAI/article/view/30316"
    }
  ],
  awards: [
    {
      title: "Innovative Application of AI Award",
      meta: "Association for the Advancement of Artificial Intelligence / 2023",
      summary: "Awarded for \"Efficient Training of Large-Scale Industrial Fault Diagnostic Models through Federated Opportunistic Block Dropout.\"",
      href: "https://www.ntu.edu.sg/computing/news-events/news/detail/scse-s-paper-won-the-innovative-application-of-ai-award-from-aaai"
    },
    {
      title: "Innovative Application of AI Award",
      meta: "Association for the Advancement of Artificial Intelligence / 2022",
      summary: "Recognized for contribution-aware federated learning methods designed for smart healthcare deployment scenarios.",
      href: "https://ojs.aaai.org/index.php/AAAI/article/view/21505"
    },
    {
      title: "Best Poster Runner-Up Award",
      meta: "Singapore ACM SIGKDD Symposium / 2023",
      summary: "Honored for work on competitive-cooperative multi-agent reinforcement learning in auction-based federated learning.",
      href: "https://www.ijcai.org/proceedings/2023/474"
    },
    {
      title: "Excellent Paper Award",
      meta: "International Journal of Crowd Science / 2023",
      summary: "Presented for a framework that supports fairness-aware design practices in ethical AI systems.",
      href: "https://trustful.federated-learning.org/awards.html"
    },
    {
      title: "Top 5 Most Popular Video Award",
      meta: "College of Engineering, NTU Singapore / 2022",
      summary: "Presented for a public-facing research communication piece on trust-based open collaborative federated learning.",
      href: "https://trustful.federated-learning.org/awards.html"
    }
  ]
};
