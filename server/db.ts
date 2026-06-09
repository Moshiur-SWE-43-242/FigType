import fs from 'fs';
import path from 'path';
import { User, TypingAttempt, Contest, ContestAttempt, Certificate, AuditLog, CMSNotice, Course } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Initialize base structure list
interface DBStructure {
  users: User[];
  typingAttempts: TypingAttempt[];
  contests: Contest[];
  contestAttempts: ContestAttempt[];
  certificates: Certificate[];
  auditLogs: AuditLog[];
  notices: CMSNotice[];
  activeOtpVerifications: Array<{ email: string; otpHash: string; expiresAt: string; verified: boolean }>;
  websiteLogo?: string;
  founderPicture?: string;
  mSquareLogo?: string;
  founderPictureSize?: number;
  adminSignaturePic?: string;
}

const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Home Row Core Fundamentals',
    description: 'Command the central row of the keyboard: A-S-D-F and J-K-L-Semicolon.',
    difficulty: 'Beginner',
    category: 'Home Row',
    lessons: [
      { id: 'l1-1', title: 'Primary Index Homing', text: 'ff jj ff jj f j f j ffjj jjff fff jjj', instructions: 'Align your index fingers on the baseline tactile ridges.', xpReward: 50, coinsReward: 20 },
      { id: 'l1-2', title: 'Left Hand Quad', text: 'asdf fdsa asdf fdsa a s d f f d s a', instructions: 'Keep your left hand fingers balanced gracefully above the keys.', xpReward: 50, coinsReward: 20 },
      { id: 'l1-3', title: 'Right Hand Quad', text: 'jkl; ;lkj jkl; ;lkj j k l ; ; l k j', instructions: 'Let your right hand hover naturally over J, K, L, and Semicolon.', xpReward: 55, coinsReward: 22 },
      { id: 'l1-4', title: 'Full Home Baseline', text: 'asdf jkl; fdsa ;lkj asdf; ;lkjfdsa fjak', instructions: 'Combine both hands on the home row to build muscle symmetry.', xpReward: 60, coinsReward: 25 },
      { id: 'l1-5', title: 'Home Row Alternations', text: 'ad jk sf l; a; s; d; f; j; k; l; fads fjak', instructions: 'Practice lateral finger spacing across the entire home row tier.', xpReward: 65, coinsReward: 28 }
    ]
  },
  {
    id: 'course-2',
    title: 'Top Row Upward Stretches',
    description: 'Extend your vertical reach toward Q-W-E-R-T and Y-U-I-O-P with strict form.',
    difficulty: 'Beginner',
    category: 'Top Row',
    lessons: [
      { id: 'l2-1', title: 'Left Top Reach', text: 'qwer rewq qwer rewq q w e r r e w q', instructions: 'Angle your left hand fingers up for the top row.', xpReward: 60, coinsReward: 25 },
      { id: 'l2-2', title: 'Right Top Reach', text: 'uiop poi text uiop poiu u i o p p o i u', instructions: 'Reach upward cleanly with your right hand.', xpReward: 60, coinsReward: 25 },
      { id: 'l2-3', title: 'Homing to Top Alternations', text: 'fr juj fr juj de ki de ki sw lo sw lo aq p;', instructions: 'Practice stretching up and returning immediately to home row.', xpReward: 65, coinsReward: 28 },
      { id: 'l2-4', title: 'Common Word Top row', text: 'quiet write power upper route prior your our pre', instructions: 'Type common English terms restricted mostly to the top row.', xpReward: 70, coinsReward: 30 },
      { id: 'l2-5', title: 'Top Row Speed Loop', text: 'qwerty uiop qwerty uiop qp wo ei ru ty yt', instructions: 'Keep a fast, rhythmic cadence while executing top keys.', xpReward: 70, coinsReward: 30 }
    ]
  },
  {
    id: 'course-3',
    title: 'Bottom Row Downward Stretches',
    description: 'Learn safe, comfortable postures for reaching down to Z-X-C-V-B and N-M-Comma-Period-Slash.',
    difficulty: 'Beginner',
    category: 'Bottom Row',
    lessons: [
      { id: 'l3-1', title: 'Left Downward Reach', text: 'zxcv vcxz zxcv vcxz z x c v v c x z', instructions: 'Drop left hand fingers down for bottom row keys.', xpReward: 60, coinsReward: 25 },
      { id: 'l3-2', title: 'Right Downward Reach', text: 'nm,. .,mn nm,. .,mn n m , . . , m n', instructions: 'Drop right hand fingers downward with light keystroke impact.', xpReward: 60, coinsReward: 25 },
      { id: 'l3-3', title: 'Diagonal Cross Stretches', text: 'fv jn fv jn dc jm dc jm sx j, sx j, az j.', instructions: 'Practice downward paths from home row reference keys.', xpReward: 65, coinsReward: 28 },
      { id: 'l3-4', title: 'Common Word Bottom row', text: 'zone zero move more context box voice bunny buzz', instructions: 'Familiarize with high frequency words emphasizing bottom keys.', xpReward: 70, coinsReward: 30 },
      { id: 'l3-5', title: 'Tri-Tier Coordinate Mix', text: 'asdf qwer zxcv jkl; uiop nm,. aqz swx dec', instructions: 'Perform an all-row coordination warm-up drill.', xpReward: 75, coinsReward: 32 }
    ]
  },
  {
    id: 'course-4',
    title: 'Left Hand Isolation',
    description: 'Condition your left hand typing speed, stamina, and coordinate placement.',
    difficulty: 'Intermediate',
    category: 'Home Row',
    lessons: [
      { id: 'l4-1', title: 'Left Base Warmup', text: 'asdfg gfdsa asdfg gfdsa fdsa dfsa asdfg', instructions: 'Focus on rapid left hand only baseline cycles.', xpReward: 65, coinsReward: 28 },
      { id: 'l4-2', title: 'Left Top Extensions', text: 'qwert trewq qwert trewq ewqt ewqr qwert', instructions: 'Exercise the outer top left keys smoothly.', xpReward: 65, coinsReward: 28 },
      { id: 'l4-3', title: 'Left Downward Swipes', text: 'zxcvb bvcxz zxcvb bvcxz xcvb xczb zxcvb', instructions: 'Flex your left hand down to the lower tier.', xpReward: 70, coinsReward: 30 },
      { id: 'l4-4', title: 'Left Hand Only Words', text: 'west card dread cage exact raw water staff waste', instructions: 'Type complete English terms using matches on the left side only.', xpReward: 75, coinsReward: 32 },
      { id: 'l4-5', title: 'Left Hand Stress Drill', text: 'asdfg qwert zxcvb gfdsa trewq bvcxz face raft', instructions: 'Develop coordination and control over your left fingers.', xpReward: 80, coinsReward: 35 }
    ]
  },
  {
    id: 'course-5',
    title: 'Right Hand Isolation',
    description: 'Condition your right hand with a focus on lateral key combinations and punctuation mapping.',
    difficulty: 'Intermediate',
    category: 'Home Row',
    lessons: [
      { id: 'l5-1', title: 'Right Base Warmup', text: 'hjkl; ;lkhj hjkl; ;lkhj jkl; kl;h hjkl;', instructions: 'Type rhythmic right hand home row combos.', xpReward: 65, coinsReward: 28 },
      { id: 'l5-2', title: 'Right Top Extensions', text: 'yuiop poiy yuiop poiy uiop poiu yuiop', instructions: 'Extend up toward outer right keys.', xpReward: 65, coinsReward: 28 },
      { id: 'l5-3', title: 'Right Downward Swipes', text: 'nm,./ /.,mn nm,./ /.,mn m,./ ,.nm nm,./', instructions: 'Angle down smoothly to register comma, period, and slashes.', xpReward: 70, coinsReward: 30 },
      { id: 'l5-4', title: 'Right Hand Only Words', text: 'poly pink opinion look hook milk million pool oily', instructions: 'Assemble English terms typed solely with your right hand.', xpReward: 75, coinsReward: 32 },
      { id: 'l5-5', title: 'Right Hand Stress Drill', text: 'hjkl; yuiop nm,./ ;lkjh poiy u /.,mn look lion', instructions: 'Strengthen right pinky and ring finger coordination.', xpReward: 80, coinsReward: 35 }
    ]
  },
  {
    id: 'course-6',
    title: 'Symmetrical Alternating Hands',
    description: 'Stabilize your typing pace by alternating characters evenly between hands.',
    difficulty: 'Intermediate',
    category: 'Home Row',
    lessons: [
      { id: 'l6-1', title: 'Alternating Doubles', text: 'fjfj fjfj dkdk dkdk slsl slsl amam amam', instructions: 'Alternate typing targets evenly across home row pairs.', xpReward: 65, coinsReward: 28 },
      { id: 'l6-2', title: 'Alternating Words Basic', text: 'the for and but not with you him her them the', instructions: 'Focus on balanced muscle memory between hands.', xpReward: 70, coinsReward: 30 },
      { id: 'l6-3', title: 'Alternating Top Tier', text: 'quality output write power quiet youth priority our', instructions: 'Practice hand alternation on the top row.', xpReward: 75, coinsReward: 32 },
      { id: 'l6-4', title: 'Alternating Lower Tier', text: 'zone move context zero bunny voice box dynamic', instructions: 'Exercise hand offsets on lower key zones.', xpReward: 75, coinsReward: 32 },
      { id: 'l6-5', title: 'Balanced Sentence Rhythms', text: 'the quick brown fox jumps over the lazy dog often', instructions: 'Execute the ultimate balanced hand alternate typing benchmark.', xpReward: 85, coinsReward: 38 }
    ]
  },
  {
    id: 'course-7',
    title: 'High Frequency Words Drills',
    description: 'Cement the top 100 most common English words for immediate cognitive recall.',
    difficulty: 'Beginner',
    category: 'Home Row',
    lessons: [
      { id: 'l7-1', title: 'Common Core 20', text: 'the of and a to in is you that it he was for on are', instructions: 'Type the most common word patterns continuously.', xpReward: 70, coinsReward: 30 },
      { id: 'l7-2', title: 'Core Pronouns', text: 'i they us him her them this that these those who which', instructions: 'Build immediate memory of common pronouns.', xpReward: 70, coinsReward: 30 },
      { id: 'l7-3', title: 'Auxiliary Verbs', text: 'be have do say get make go know take see come think', instructions: 'Train hand movements for standard English action words.', xpReward: 75, coinsReward: 32 },
      { id: 'l7-4', title: 'Relative Modifiers', text: 'some other such good new first last own any only same', instructions: 'Execute common structural descriptors.', xpReward: 75, coinsReward: 32 },
      { id: 'l7-5', title: 'Fluent Phrase Stream', text: 'with the people who have been to the place before us', instructions: 'Combine high frequency terms into smooth prose chunks.', xpReward: 80, coinsReward: 35 }
    ]
  },
  {
    id: 'course-8',
    title: 'Letter Doublets and Triplets',
    description: 'Condition your muscle memory for repeating letters and syllables (ee, oo, ll, sst).',
    difficulty: 'Intermediate',
    category: 'Top Row',
    lessons: [
      { id: 'l8-1', title: 'Vowel Duplicity', text: 'feed book meet look need good keep pool seed look', instructions: 'Type double vowels under continuous hand pressure.', xpReward: 70, coinsReward: 30 },
      { id: 'l8-2', title: 'Consonant Duplicity', text: 'well roll full call back tell hill pass bell staff', instructions: 'Execute doubling paths on common double consonants.', xpReward: 70, coinsReward: 30 },
      { id: 'l8-3', title: 'Triple Letter Transitions', text: 'assessment addresses states stressful processes assets', instructions: 'Type rapid repeating letter series with high focus.', xpReward: 75, coinsReward: 32 },
      { id: 'l8-4', title: 'Suffix Syllable chords', text: 'running typing working coding processing playing', instructions: 'Build speed on common grammatical endings.', xpReward: 80, coinsReward: 35 },
      { id: 'l8-5', title: 'Composite Repeating Strings', text: 'the full feeling of success keeps the team working', instructions: 'Test accuracy over diverse repeating letter combinations.', xpReward: 85, coinsReward: 38 }
    ]
  },
  {
    id: 'course-9',
    title: 'Short Word Cadence',
    description: 'Maintain high typing velocity and accurate pacing over compact three-letter segments.',
    difficulty: 'Beginner',
    category: 'Home Row',
    lessons: [
      { id: 'l9-1', title: 'Basic Triads', text: 'cat dog sun run map tap cap nap gap lap rap', instructions: 'Maintain identical letter strike timing on small words.', xpReward: 60, coinsReward: 25 },
      { id: 'l9-2', title: 'Functional Triads', text: 'and but not for the you him her out our its dry', instructions: 'Perform drills on extremely common functional terms.', xpReward: 65, coinsReward: 28 },
      { id: 'l9-3', title: 'Action Triads', text: 'get fit try fly spy buy cry sky why act ask add', instructions: 'Practice small command terms under strict hand form.', xpReward: 65, coinsReward: 28 },
      { id: 'l9-4', title: 'Mixed Character Triads', text: 'six box zip jam fix mix tax wax fox raw key fee', instructions: 'Stretch fingers to touch less frequent typing keys.', xpReward: 70, coinsReward: 30 },
      { id: 'l9-5', title: 'Triad Sentential Loop', text: 'the fat cat ran for the wet rug but got too cold', instructions: 'Train rhythmic hand shifts across short phrases.', xpReward: 75, coinsReward: 32 }
    ]
  },
  {
    id: 'course-10',
    title: 'Medium Sentence Transitions',
    description: 'Stabilize your posture and pacing through intermediate-length sentences with punctuation.',
    difficulty: 'Intermediate',
    category: 'Home Row',
    lessons: [
      { id: 'l10-1', title: 'Declarative Phrase', text: 'The core objective of software engineering is to design durable logic rules.', instructions: 'Capitalize starts and terminate with a clean period stroke.', xpReward: 75, coinsReward: 32 },
      { id: 'l10-2', title: 'Cooperative Phrase', text: 'Teams succeed when designers cooperate with program developers to resolve issues.', instructions: 'Test muscle coordination over multi-syllable terms.', xpReward: 75, coinsReward: 32 },
      { id: 'l10-3', title: 'Complex Subordination', text: 'Although the system was severely congested, our neural adapter performed well.', instructions: 'Execute appropriate commas with high timing accuracy.', xpReward: 80, coinsReward: 35 },
      { id: 'l10-4', title: 'Analytical Evaluation', text: 'Keystroke coordinates track millisecond latencies across modern interface terminals.', instructions: 'Challenge your spelling proficiency and endurance.', xpReward: 85, coinsReward: 38 },
      { id: 'l10-5', title: 'Full Prose Paradigm', text: 'A skilled typist maintains vertical forearm posture while striking home keys lights.', instructions: 'A perfect accuracy benchmark drill to gauge cognitive form.', xpReward: 90, coinsReward: 40 }
    ]
  },
  {
    id: 'course-11',
    title: 'Capitalization & Shift Keys',
    description: 'Master the left and right Shift keys for high-speed proper nouns and uppercase streams.',
    difficulty: 'Intermediate',
    category: 'Home Row',
    lessons: [
      { id: 'l11-1', title: 'Left Shift Priming', text: 'John Mary Paul Kevin Laura Steve Tim Rachel Mike David', instructions: 'Use right hand letters while depressing the left Shift keys.', xpReward: 70, coinsReward: 30 },
      { id: 'l11-2', title: 'Right Shift Priming', text: 'Alice Bob Charlie Frank Grace Helen Victor Wendy Xavier Ziyi', instructions: 'Use left hand letters while depressing the right Shift keys.', xpReward: 70, coinsReward: 30 },
      { id: 'l11-3', title: 'Proper Global Entities', text: 'Bangladesh Dhaka Asia Europe America Canada Japan Germany India', instructions: 'Practice complex geographic proper noun names rapidly.', xpReward: 75, coinsReward: 32 },
      { id: 'l11-4', title: 'Acronym Declarations', text: 'VITE REACT HTML CSS JSON REST API GRAPHQL YAML WPM CPM XP', instructions: 'Maintain uppercase flows with alternating hands.', xpReward: 80, coinsReward: 35 },
      { id: 'l11-5', title: 'Proper Sentential Streams', text: 'Mr. Moshiur Rahaman Riat founded the FigTyp Esports Arena in 2026.', instructions: 'Integrate shifts, numbers, and common symbols gracefully.', xpReward: 90, coinsReward: 42 }
    ]
  },
  {
    id: 'course-12',
    title: 'Basic Punctuation Marks',
    description: 'Learn comfortable reaches for commas, periods, question marks, and exclamation points.',
    difficulty: 'Intermediate',
    category: 'Numbers & Symbols',
    lessons: [
      { id: 'l12-1', title: 'Comma Interruption', text: 'first, second, third, fourth, fifth, sixth, seventh, eighth', instructions: 'Align bottom row downward offsets for commas.', xpReward: 70, coinsReward: 30 },
      { id: 'l12-2', title: 'Period Terminators', text: 'System on. Engine active. Handshake completed. Diagnostics OK.', instructions: 'Strike precise period characters without looking down.', xpReward: 70, coinsReward: 30 },
      { id: 'l12-3', title: 'Interrogative Prompts', text: 'Who active? What WPM? Where dashboard? Is database authenticated?', instructions: 'Type the shift slash chord to generate question marks.', xpReward: 75, coinsReward: 32 },
      { id: 'l12-4', title: 'Exclamatory Feedback', text: 'Perfect! Speedrun completed! Level up! New badges unlocked!', instructions: 'Reach shift 1 cleanly for the energetic exclamation point.', xpReward: 80, coinsReward: 35 },
      { id: 'l12-5', title: 'Mixed punctuation prosecut', text: 'Hello, world! Are you ready? Yes, let us start the assessment.', instructions: 'Test composite punctuation pacing in a standard dialogue.', xpReward: 85, coinsReward: 38 }
    ]
  },
  {
    id: 'course-13',
    title: 'Mathematical Operator Coding',
    description: 'Expose your hands to programmatic math operands (+, -, *, /, =).',
    difficulty: 'Intermediate',
    category: 'Coding',
    lessons: [
      { id: 'l13-1', title: 'Variable Assignment', text: 'let x = 10; const y = 20; let total = x + y;', instructions: 'Practice the equal sign reach next to your delete key.', xpReward: 80, coinsReward: 35 },
      { id: 'l13-2', title: 'Simple Arithmetic', text: 'ratio = total / multiplier; current = peak - valley;', instructions: 'Reach back slash and outer dashes smoothly.', xpReward: 80, coinsReward: 35 },
      { id: 'l13-3', title: 'Loop Incrementals', text: 'for (let i = 0; i < limit; i += 2) { step *= factor; }', instructions: 'Integrate greater than, less than, and math operators.', xpReward: 85, coinsReward: 38 },
      { id: 'l13-4', title: 'Logical Comparisons', text: 'isValid = (score >= threshold) && (accuracy === 100);', instructions: 'Type logical operators, equal strings, and ampersands.', xpReward: 90, coinsReward: 40 },
      { id: 'l13-5', title: 'Advanced Mathematical expressions', text: 'result = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) / delta;', instructions: 'Combine parenthesis, powers, and operational functions.', xpReward: 100, coinsReward: 45 }
    ]
  },
  {
    id: 'course-14',
    title: 'Syntactic Bracket Overviews',
    description: 'Develop precision when wrapping scope declarations in parentheses, square, and curly braces.',
    difficulty: 'Advanced',
    category: 'Coding',
    lessons: [
      { id: 'l14-1', title: 'Parenthesis Packing', text: 'function calculate(input) { return convert(evaluate(input)); }', instructions: 'Keep your hands home while executing shift 9 and 0.', xpReward: 85, coinsReward: 38 },
      { id: 'l14-2', title: 'Square Matrix Vectors', text: 'const matrix = [1, 2, 3]; const element = matrix[idx];', instructions: 'Stretch pinkies outward to tap standard brackets.', xpReward: 85, coinsReward: 38 },
      { id: 'l14-3', title: 'Curly Object Literals', text: 'const config = { active: true, ports: [3000, 80], mode: "spa" };', instructions: 'Practice complex shift brackets and nested values.', xpReward: 90, coinsReward: 40 },
      { id: 'l14-4', title: 'Composite Bracket Arrays', text: 'const data = [{ id: 1, coordinates: [10.5, 99.4] }];', instructions: 'Maintain typing speed over heavy mixed braces.', xpReward: 95, coinsReward: 42 },
      { id: 'l14-5', title: 'Bracket Matrix Speed Benchmark', text: '({ user: [ { token: resolve() } ] })', instructions: 'Keep fingers steady while typing abstract bracket blocks.', xpReward: 100, coinsReward: 45 }
    ]
  },
  {
    id: 'course-15',
    title: 'Terminal Command Drills',
    description: 'Accelerate your deployment velocities by practicing common developer Shell operations.',
    difficulty: 'Advanced',
    category: 'Coding',
    lessons: [
      { id: 'l15-1', title: 'Docker Orchestration', text: 'docker compose up --build -d && docker ps -a', instructions: 'Familiarize with standard container launch parameters.', xpReward: 85, coinsReward: 38 },
      { id: 'l15-2', title: 'Git Revision Controls', text: 'git commit -m "feat: resolve super admin access" && git push', instructions: 'Type common Git workflows under fluid movement.', xpReward: 85, coinsReward: 38 },
      { id: 'l15-3', title: 'Package Installations', text: 'npm install --save-dev typescript @types/react tsx esbuild', instructions: 'Focus on dash layouts and space separations.', xpReward: 90, coinsReward: 40 },
      { id: 'l15-4', title: 'File System Operations', text: 'mkdir -p server/routes && touch server.ts && rm -rf dist', instructions: 'Practice slashes, paths, and flags.', xpReward: 95, coinsReward: 42 },
      { id: 'l15-5', title: 'Linter Execution', text: 'npx eslint . --fix && npm run build && npm run start', instructions: 'Deliver complex developer task streams accurately.', xpReward: 100, coinsReward: 45 }
    ]
  },
  {
    id: 'course-16',
    title: 'Numeric Digit Intervals',
    description: 'Train hand spatial awareness on the numeric upper tier number line (1-2-3-4-5-6-7-8-9-0).',
    difficulty: 'Intermediate',
    category: 'Numbers & Symbols',
    lessons: [
      { id: 'l16-1', title: 'Baseline 1 to 5', text: '11 22 33 44 55 123 234 345 456 543 210', instructions: 'Stretch fingers to reach leftmost numeric keys.', xpReward: 70, coinsReward: 30 },
      { id: 'l16-2', title: 'Baseline 6 to 0', text: '66 77 88 99 00 678 789 890 098 876 654', instructions: 'Stretch fingers to reach rightmost numeric keys.', xpReward: 70, coinsReward: 30 },
      { id: 'l16-3', title: 'Alternating Decimals', text: '10 20 30 40 50 60 770 880 990 100 500', instructions: 'Train number transitions with trailing zeros.', xpReward: 75, coinsReward: 32 },
      { id: 'l16-4', title: 'Mixed Digit Coordinates', text: '242 606 195 2026 1000 86400 3000 320 90', instructions: 'Input parameters and coordinate keys gracefully.', xpReward: 80, coinsReward: 35 },
      { id: 'l16-5', title: 'Complex Date Ranges', text: '2026-05-21T10:04:53Z 1999-12-31 2025-10-15', instructions: 'Coordinate numbers, dashes, and letters in ISO timelines.', xpReward: 95, coinsReward: 42 }
    ]
  },
  {
    id: 'course-17',
    title: 'Database & SQL Syntaxes',
    description: 'Optimize queries speeds by practicing structured relational statement patterns.',
    difficulty: 'Advanced',
    category: 'Coding',
    lessons: [
      { id: 'l17-1', title: 'Select Standard Queries', text: 'SELECT * FROM users WHERE role = \'SUPER_ADMIN\';', instructions: 'Type common SQL select statements with quote modifiers.', xpReward: 90, coinsReward: 40 },
      { id: 'l17-2', title: 'Insert Records', text: 'INSERT INTO attempts (id, wpm) VALUES (\'att-99\', 105);', instructions: 'Combine parenthesis, commas, and string inserts.', xpReward: 90, coinsReward: 40 },
      { id: 'l17-3', title: 'Update Declarations', text: 'UPDATE users SET coins = coins + 150 WHERE id = \'u-1\';', instructions: 'Type common SQL fields modification commands.', xpReward: 95, coinsReward: 42 },
      { id: 'l17-4', title: 'Table Joins', text: 'SELECT u.username, c.title FROM users u JOIN certs c ON u.id = c.uid;', instructions: 'Integrate dot notations and abbreviations.', xpReward: 100, coinsReward: 45 },
      { id: 'l17-5', title: 'Index Constructions', text: 'CREATE UNIQUE INDEX idx_users_email ON users(email);', instructions: 'Accelerate index generation statements coding speed.', xpReward: 105, coinsReward: 48 }
    ]
  },
  {
    id: 'course-18',
    title: 'HTML & Layout Markups',
    description: 'Condition fingers for tag wrapping, attributes, and DOM representations.',
    difficulty: 'Intermediate',
    category: 'Coding',
    lessons: [
      { id: 'l18-1', title: 'Basic Div Wrappings', text: '<div id="profile-card" className="p-4 bg-slate-900 border">', instructions: 'Reach less-than and greater-than tags under relaxed touch control.', xpReward: 80, coinsReward: 35 },
      { id: 'l18-2', title: 'Heading Structure hierarchy', text: '<h1 className="text-xl font-display font-medium text-white"></h1>', instructions: 'Practice heading tags and long className attributes.', xpReward: 80, coinsReward: 35 },
      { id: 'l18-3', title: 'Hypermedia Links', text: '<a href="https://figtyp.ai" target="_blank" rel="noopener"></a>', instructions: 'Integrate string addresses and protocols.', xpReward: 85, coinsReward: 38 },
      { id: 'l18-4', title: 'Unordered Lists', text: '<ul><li className="text-xs">First Module</li></ul>', instructions: 'Type double tags under continuous hand pressure.', xpReward: 90, coinsReward: 40 },
      { id: 'l18-5', title: 'Component Closures', text: '</main><BrandedFooter onSelectTab={setActiveTab} />', instructions: 'Input combined custom component declarations without checking the keyboard.', xpReward: 95, coinsReward: 42 }
    ]
  },
  {
    id: 'course-19',
    title: 'Python Logic Formats',
    description: 'Condition your muscle memory for colon separators, indent blocks, and snake_case paradigms.',
    difficulty: 'Advanced',
    category: 'Coding',
    lessons: [
      { id: 'l19-1', title: 'Method Definitions', text: 'def calculate_wpm(total_chars, minutes):', instructions: 'Combine colons, parenthesis, and spacing.', xpReward: 85, coinsReward: 38 },
      { id: 'l19-2', title: 'Conditional Guards', text: 'if total_chars > 0 and minutes > 0: return (total_chars / 5) / minutes', instructions: 'Navigate keyword boolean expressions easily.', xpReward: 90, coinsReward: 40 },
      { id: 'l19-3', title: 'List Comprehensions', text: 'clean_attempts = [a for a in attempts if not a.is_suspicious]', instructions: 'Integrate square brackets, loops, and conditions.', xpReward: 95, coinsReward: 42 },
      { id: 'l19-4', title: 'Error Handlers', text: 'try: api.evaluate() except Exception as err: logger.error(err)', instructions: 'Exercise try-except control paths.', xpReward: 100, coinsReward: 45 },
      { id: 'l19-5', title: 'Class Architectures', text: 'class NeuralEvaluator(BaseModel): def __init__(self, key): pass', instructions: 'Practice double underscores (dunder methods) and class declarations.', xpReward: 105, coinsReward: 48 }
    ]
  },
  {
    id: 'course-20',
    title: 'JavaScript Async Fetch API',
    description: 'Master fetch calls, promise chains, asynchronous handlers, and parsing mechanisms.',
    difficulty: 'Advanced',
    category: 'Coding',
    lessons: [
      { id: 'l20-1', title: 'Fetch Handshakes', text: 'const res = await fetch("/api/attempts");', instructions: 'Practice common quote paths and API routers.', xpReward: 90, coinsReward: 40 },
      { id: 'l20-2', title: 'Content Type Guards', text: 'const contentType = res.headers.get("content-type");', instructions: 'Coordinate string parameter matches.', xpReward: 90, coinsReward: 40 },
      { id: 'l20-3', title: 'Promise Customization', text: 'if (res.ok && contentType.includes("application/json")) { return await res.json(); }', instructions: 'Practice combined validation conditions.', xpReward: 95, coinsReward: 42 },
      { id: 'l20-4', title: 'JSON Error Safeguards', text: 'try { const data = await res.json(); } catch (err) { console.warn(err); }', instructions: 'Input error logs in standard developer statements.', xpReward: 100, coinsReward: 45 },
      { id: 'l20-5', title: 'Full API Integrations', text: 'fetch("/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" } });', instructions: 'Assemble complete complex full-stack request blocks.', xpReward: 110, coinsReward: 50 }
    ]
  },
  {
    id: 'course-21',
    title: 'Neural System Concepts',
    description: 'Test your typing coordination on advanced conceptual descriptions of FigTyp.',
    difficulty: 'Expert',
    category: 'Steno Shorthand',
    lessons: [
      { id: 'l21-1', title: 'Cryptographic Hashing', text: 'Cryptographic keystroke verification protocols authenticate true user dexterity limits.', instructions: 'Test accuracy over high-syllable terms.', xpReward: 100, coinsReward: 45 },
      { id: 'l21-2', title: 'Cognitive Motor safety', text: 'Correct hand alignment decreases repetitive stress strain while improving character consistency.', instructions: 'Reinforce vertical arm alignments during prose tests.', xpReward: 100, coinsReward: 45 },
      { id: 'l21-3', title: 'Biometric Keystrokes', text: 'Handshake latency coordinates map typing frequency variances to evaluate skill plateaus.', instructions: 'Maintain consistent pace on technical descriptors.', xpReward: 105, coinsReward: 48 },
      { id: 'l21-4', title: 'Neural Diagnostics', text: 'Generative AI engines analyze typing speed trends and construct targeted layout advice.', instructions: 'Execute long prose statements under perfect focus.', xpReward: 110, coinsReward: 50 },
      { id: 'l21-5', title: 'Engineering Coalition', text: 'MiraCore Logix and M-Square Devs group deliver the ultimate neural typing progress workspace.', instructions: 'Complete the expert speed benchmarking lesson!', xpReward: 120, coinsReward: 55 }
    ]
  }
];

const DEFAULT_CONTESTS: Contest[] = [
  {
    id: 'contest-1',
    title: 'Neural Core Daily Speedrun',
    description: 'The official daily speedrun hosted by MiraCore Logix. Prove your dexterity!',
    visibility: 'PUBLIC',
    status: 'LIVE',
    contestText: 'Artificial neural networks process inputs across millions of synaptic connections in real time.',
    duration: 60,
    shareCode: 'daily-neuro',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(),
    createdById: 'system',
    createdAt: new Date().toISOString(),
    participants: 12
  },
  {
    id: 'contest-2',
    title: 'Daffodil Tech Championship',
    description: 'Exclusive arena contest hosted for Daffodil International University computing squads.',
    visibility: 'PUBLIC',
    status: 'LIVE',
    contestText: 'Engineering clean and scalable software systems is the ultimate objective of modern software developers.',
    duration: 45,
    shareCode: 'diu-swe',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(),
    createdById: 'system',
    createdAt: new Date().toISOString(),
    participants: 8
  }
];

const DEFAULT_NOTICES: CMSNotice[] = [
  {
    id: 'notice-1',
    title: 'Welcome to FigTyp Neural Arena!',
    content: 'FigTyp v1.0.0 is officially live! Experience the absolute peak of adaptive cloud typing, steno lessons, multiplayer speed matches, and customized AI evaluations.',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notice-2',
    title: 'Global Tournaments Coming Soon',
    content: 'Pre-registration for the MiraCore Championship begins in June 2026. Keep practicing and leveling up to unlock premium badges and titles!',
    active: true,
    createdAt: new Date().toISOString()
  }
];

function loadDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to load database. Re-initializing default db.', e);
  }

  // Create default db
  const defaultDB: DBStructure = {
    users: [
      {
        id: 'super-admin-swe',
        email: 'riat.moshiur22@gmail.com',
        username: 'MoshiurSWE',
        fullName: 'Md Moshiur Rahaman Riat',
        role: 'SUPER_ADMIN',
        xp: 2450,
        level: 24,
        coins: 1300,
        streak: 8,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'super-admin-school',
        email: 'rahaman242-35-606@diu.edu.bd',
        username: 'RiatSWE',
        fullName: 'Md Moshiur Rahaman Riat (DIU)',
        role: 'SUPER_ADMIN',
        xp: 1500,
        level: 15,
        coins: 850,
        streak: 5,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-user',
        email: 'developer@example.com',
        username: 'CyberCoder',
        fullName: 'Alex River',
        role: 'GENERAL_USER',
        xp: 750,
        level: 8,
        coins: 420,
        streak: 3,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ],
    typingAttempts: [
      {
        id: 'att-1',
        userId: 'demo-user',
        mode: 'quote',
        duration: 30,
        wordCount: 35,
        wpm: 82,
        rawWpm: 88,
        accuracy: 96.5,
        consistency: 89.2,
        correctChars: 165,
        incorrectChars: 6,
        totalChars: 171,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'att-2',
        userId: 'demo-user',
        mode: 'time',
        duration: 15,
        wordCount: 18,
        wpm: 92,
        rawWpm: 95,
        accuracy: 98.1,
        consistency: 91.5,
        correctChars: 90,
        incorrectChars: 2,
        totalChars: 92,
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    contests: DEFAULT_CONTESTS,
    contestAttempts: [
      {
        id: 'ca-1',
        contestId: 'contest-1',
        userId: 'demo-user',
        username: 'CyberCoder',
        wpm: 76,
        rawWpm: 80,
        accuracy: 95.8,
        progress: 100,
        correctChars: 150,
        incorrectChars: 7,
        completed: true,
        suspicious: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ca-2',
        contestId: 'contest-1',
        userId: 'bot-1',
        username: 'ZenTypist_Bot',
        wpm: 85,
        rawWpm: 85,
        accuracy: 99.0,
        progress: 100,
        correctChars: 156,
        incorrectChars: 2,
        completed: true,
        suspicious: false,
        createdAt: new Date().toISOString()
      }
    ],
    certificates: [
      {
        id: 'cert-001',
        userId: 'demo-user',
        username: 'CyberCoder',
        fullName: 'Alex River',
        wpm: 92,
        accuracy: 98.1,
        mode: 'Championship Speedrun',
        issueDate: new Date().toISOString(),
        verificationUrl: 'https://figtyp.ai/certs/verify/cert-001',
        qrCodeData: 'FIGTYP-VERIFY:cert-001:92WPM:98.1%',
        signature: 'Md Moshiur Rahaman Riat'
      }
    ],
    auditLogs: [
      {
        id: 'audit-1',
        userId: 'super-admin-swe',
        action: 'SUPER_ADMIN_INIT',
        ipAddress: '127.0.0.1',
        userAgent: 'Mock Browser',
        metadata: { info: 'System booted successfully' },
        createdAt: new Date().toISOString()
      }
    ],
    notices: DEFAULT_NOTICES,
    activeOtpVerifications: [],
    websiteLogo: '',
    founderPicture: '',
    mSquareLogo: '',
    founderPictureSize: 48,
    adminSignaturePic: ''
  };

  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(data: DBStructure): void {
  try {
    const parentDir = path.dirname(DB_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file', e);
  }
}

// Global state in-memory
const state = loadDB();

export const db = {
  getUsers: () => state.users,
  getUserById: (id: string) => state.users.find(u => u.id === id),
  getUserByEmail: (email: string) => state.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  getUserByUsername: (username: string) => state.users.find(u => u.username?.toLowerCase() === username.toLowerCase()),
  saveUser: (user: User) => {
    const idx = state.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      state.users[idx] = user;
    } else {
      state.users.push(user);
    }
    saveDB(state);
    return user;
  },

  getAttempts: () => state.typingAttempts,
  saveAttempt: (attempt: TypingAttempt) => {
    state.typingAttempts.push(attempt);
    saveDB(state);
    return attempt;
  },

  getContests: () => state.contests,
  getContestById: (id: string) => state.contests.find(c => c.id === id),
  getContestByShareCode: (code: string) => state.contests.find(c => c.shareCode === code),
  saveContest: (contest: Contest) => {
    const idx = state.contests.findIndex(c => c.id === contest.id);
    if (idx >= 0) {
      state.contests[idx] = contest;
    } else {
      state.contests.push(contest);
    }
    saveDB(state);
    return contest;
  },
  deleteContest: (id: string) => {
    state.contests = state.contests.filter(c => c.id !== id);
    state.contestAttempts = state.contestAttempts.filter(a => a.contestId !== id);
    saveDB(state);
  },

  getContestAttempts: (contestId: string) => state.contestAttempts.filter(ca => ca.contestId === contestId),
  saveContestAttempt: (attempt: ContestAttempt) => {
    const idx = state.contestAttempts.findIndex(ca => ca.contestId === attempt.contestId && ca.userId === attempt.userId);
    if (idx >= 0) {
      state.contestAttempts[idx] = attempt;
    } else {
      state.contestAttempts.push(attempt);
    }
    // Update contest participant count
    const cnt = state.contests.find(c => c.id === attempt.contestId);
    if (cnt) {
      const distinctUsers = new Set(db.getContestAttempts(attempt.contestId).map(a => a.userId));
      cnt.participants = distinctUsers.size;
    }
    saveDB(state);
    return attempt;
  },

  getCertificates: () => state.certificates,
  getCertificateById: (id: string) => state.certificates.find(c => c.id === id),
  saveCertificate: (cert: Certificate) => {
    state.certificates.push(cert);
    saveDB(state);
    return cert;
  },

  getAuditLogs: () => state.auditLogs,
  saveAuditLog: (log: AuditLog) => {
    state.auditLogs.unshift(log);
    // capped size
    if (state.auditLogs.length > 200) {
      state.auditLogs = state.auditLogs.slice(0, 200);
    }
    saveDB(state);
    return log;
  },

  getNotices: () => state.notices,
  saveNotice: (notice: CMSNotice) => {
    const idx = state.notices.findIndex(n => n.id === notice.id);
    if (idx >= 0) {
      state.notices[idx] = notice;
    } else {
      state.notices.push(notice);
    }
    saveDB(state);
    return notice;
  },
  deleteNotice: (id: string) => {
    state.notices = state.notices.filter(n => n.id !== id);
    saveDB(state);
  },

  getCourses: () => DEFAULT_COURSES,

  getOtps: () => state.activeOtpVerifications,
  saveOtp: (otpRecord: { email: string; otpHash: string; expiresAt: string; verified: boolean }) => {
    state.activeOtpVerifications.push(otpRecord);
    saveDB(state);
  },
  verifyOtpCode: (email: string, receivedOtpHash: string) => {
    // simple matching helper
    const record = state.activeOtpVerifications.find(
      r => r.email.toLowerCase() === email.toLowerCase() && !r.verified
    );
    if (record) {
      record.verified = true;
      saveDB(state);
      return true;
    }
    return false;
  },

  getWebsiteLogo: () => state.websiteLogo || '',
  saveWebsiteLogo: (logo: string) => {
    state.websiteLogo = logo;
    saveDB(state);
  },
  getAdminSignaturePic: () => state.adminSignaturePic || '',
  saveAdminSignaturePic: (pic: string) => {
    state.adminSignaturePic = pic;
    saveDB(state);
  },
  getFounderPicture: () => state.founderPicture || '',
  saveFounderPicture: (pic: string) => {
    state.founderPicture = pic;
    saveDB(state);
  },
  getFounderPictureSize: () => state.founderPictureSize || 48,
  saveFounderPictureSize: (size: number) => {
    state.founderPictureSize = size;
    saveDB(state);
  },
  getMSquareLogo: () => state.mSquareLogo || '',
  saveMSquareLogo: (logo: string) => {
    state.mSquareLogo = logo;
    saveDB(state);
  }
};
