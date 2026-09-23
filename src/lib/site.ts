export const church = {
  name: process.env.NEXT_PUBLIC_CHURCH_NAME ?? "Grace Covenant Church",
  shortName: "Grace Covenant",
  tagline: "Rooted in Christ. Reaching the world.",
  mission:
    "To make disciples of Jesus Christ who love God deeply, love people genuinely, and serve the world faithfully.",
  vision:
    "A Christ-centred community where every generation encounters the living God, grows in the truth of Scripture, and carries the hope of the gospel into every corner of our city.",
  address: process.env.NEXT_PUBLIC_CHURCH_ADDRESS ?? "12 Cornerstone Avenue, Riverside District",
  city: "Springfield",
  phone: process.env.NEXT_PUBLIC_CHURCH_PHONE ?? "+1 (555) 014-8820",
  email: process.env.NEXT_PUBLIC_CHURCH_EMAIL ?? "hello@gracecovenant.org",
  serviceTimes: [
    { name: "Sunday First Service", time: "7:30 AM – 9:00 AM" },
    { name: "Sunday Main Service", time: "9:30 AM – 11:30 AM" },
    { name: "Wednesday Bible Study", time: "6:00 PM – 7:30 PM" },
    { name: "Friday Prayer Meeting", time: "6:30 PM – 8:00 PM" },
  ],
  socials: [
    { label: "Facebook", href: "https://facebook.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "Instagram", href: "https://instagram.com" },
  ],
} as const;

export const coreValues = [
  {
    title: "Scripture First",
    body: "The Bible is our final authority for faith, teaching, and daily practice.",
  },
  {
    title: "Christ-Centred Worship",
    body: "Every gathering lifts up Jesus Christ in spirit and in truth.",
  },
  {
    title: "Authentic Community",
    body: "We grow together in small groups where people are known, loved, and discipled.",
  },
  {
    title: "Compassionate Service",
    body: "Faith works through love — we serve our neighbours in practical ways.",
  },
  {
    title: "Generational Discipleship",
    body: "Children, youth, and adults are equipped to follow Jesus for a lifetime.",
  },
  {
    title: "Global Mission",
    body: "The gospel is for every nation, and we send and support those who go.",
  },
] as const;

export const beliefs = [
  {
    title: "The Bible",
    body: "We believe the Bible is the inspired, trustworthy Word of God, without error in all it affirms, and the final authority for faith and conduct (2 Timothy 3:16-17).",
  },
  {
    title: "God",
    body: "We believe in one eternal God, existing in three persons — Father, Son, and Holy Spirit — perfect in holiness, wisdom, power, and love (Deuteronomy 6:4; Matthew 28:19).",
  },
  {
    title: "Jesus Christ",
    body: "We believe Jesus Christ is fully God and fully man, born of a virgin, crucified for our sins, raised bodily on the third day, and now reigning as Lord (John 1:1-14; 1 Corinthians 15:3-4).",
  },
  {
    title: "The Holy Spirit",
    body: "We believe the Holy Spirit convicts, regenerates, indwells, and empowers believers for holy living and gospel witness (John 16:8; Acts 1:8).",
  },
  {
    title: "Salvation",
    body: "We believe salvation is the gift of God received by grace through faith in Jesus Christ alone, not by works (Ephesians 2:8-9).",
  },
  {
    title: "The Church",
    body: "We believe the Church is the body of Christ, called to worship, discipleship, fellowship, service, and mission (Acts 2:42-47).",
  },
  {
    title: "Baptism & Communion",
    body: "We believe in baptism by immersion as an act of obedience, and in the Lord's Supper as a remembrance of Christ's death until He comes (Matthew 28:19; 1 Corinthians 11:23-26).",
  },
  {
    title: "Christian Living",
    body: "We believe followers of Jesus are called to holiness, integrity, generosity, and love expressed in everyday life (Romans 12:1-2).",
  },
  {
    title: "The Resurrection",
    body: "We believe in the bodily resurrection of the dead — the just to everlasting life and the unjust to judgement (1 Corinthians 15:20-23).",
  },
  {
    title: "Eternal Life",
    body: "We believe in the personal return of Jesus Christ and the promise of eternal life with God for all who trust in Him (John 3:16; Revelation 21:1-4).",
  },
] as const;

export const ministries = [
  {
    title: "Worship",
    icon: "🎶",
    body: "Spirit-filled, Christ-exalting worship gatherings each Sunday with a team that serves in music, media, and hospitality.",
  },
  {
    title: "Prayer",
    icon: "🙏",
    body: "Weekly prayer meetings, intercession teams, and prayer support for every request brought to the church.",
  },
  {
    title: "Evangelism",
    icon: "📣",
    body: "Neighbourhood outreach, campus missions, and gospel conversations that introduce people to Jesus.",
  },
  {
    title: "Discipleship",
    icon: "📖",
    body: "Bible studies, membership classes, and small groups that help believers grow deep roots in Scripture.",
  },
  {
    title: "Youth Ministry",
    icon: "🔥",
    body: "A safe, joyful community where teenagers build faith, friendships, and godly character.",
  },
  {
    title: "Children Ministry",
    icon: "🧒",
    body: "Age-appropriate Bible teaching, worship, and care for children every Sunday, led by screened volunteers.",
  },
  {
    title: "Community Outreach",
    icon: "🤝",
    body: "Food distribution, medical outreach, and practical help for families in the Riverside district.",
  },
  {
    title: "Missions",
    icon: "🌍",
    body: "Partnering with and sending missionaries to unreached communities at home and abroad.",
  },
  {
    title: "Charity & Benevolence",
    icon: "💛",
    body: "A benevolence fund and volunteer network supporting widows, orphans, and members in crisis.",
  },
  {
    title: "Leadership Development",
    icon: "🎓",
    body: "Training for emerging leaders in teaching, pastoral care, administration, and service.",
  },
] as const;

export const leadership = [
  {
    name: "Pastor Daniel Okoye",
    role: "Senior Pastor",
    bio: "Serving the congregation for over fifteen years with a passion for expository preaching and pastoral care.",
  },
  {
    name: "Pastor Miriam Adeyemi",
    role: "Associate Pastor, Discipleship",
    bio: "Leads small groups, membership classes, and the church-wide Bible reading plan.",
  },
  {
    name: "Elder Samuel Ochieng",
    role: "Elder, Missions & Outreach",
    bio: "Coordinates local outreach teams and our global mission partnerships.",
  },
  {
    name: "Grace Mensah",
    role: "Director, Children & Youth",
    bio: "Oversees children's church, youth fellowship, and volunteer safeguarding training.",
  },
] as const;

export const history = [
  {
    year: "1998",
    body: "Grace Covenant Church began as a prayer fellowship of twelve families meeting in a living room.",
  },
  {
    year: "2004",
    body: "The congregation moved into its first rented hall and launched children's and youth ministries.",
  },
  {
    year: "2012",
    body: "The current sanctuary on Cornerstone Avenue was dedicated, seating over 600 worshippers.",
  },
  {
    year: "2019",
    body: "Community outreach expanded with a weekly food pantry and free medical clinic days.",
  },
  {
    year: "Today",
    body: "A multi-generational church family serving Springfield and supporting mission partners worldwide.",
  },
] as const;

export const sermonCategories = [
  "General",
  "Sunday Service",
  "Bible Study",
  "Conference",
  "Youth",
  "Special Service",
] as const;

export const mediaCategories = [
  "Church Activities",
  "Worship",
  "Outreach",
  "Conferences",
  "Youth",
  "Livestream",
] as const;
