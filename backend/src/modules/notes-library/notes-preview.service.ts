// Utility to generate structured preview pages and compliant standard PDF 1.4 binary documents
export interface NotePageContent {
  pageNumber: number;
  chapterTitle: string;
  topicTitle: string;
  keyConcepts: string[];
  notesText: string;
  formulaOrCode?: {
    label: string;
    code: string;
  };
  professorTip?: string;
  practiceQuestion?: string;
}

export interface NotePreviewData {
  noteId: string;
  title: string;
  subject: string;
  authorName: string;
  university: string;
  semester: string;
  branch: string;
  totalPages: number;
  price: number;
  stars: number;
  downloads: number;
  pages: NotePageContent[];
}

export function getStructuredNoteContent(note: any): NotePreviewData {
  const subjectLower = (note.subject || '').toLowerCase();
  const titleLower = (note.title || '').toLowerCase();

  let pages: NotePageContent[] = [];

  if (subjectLower.includes('operat') || titleLower.includes('os') || titleLower.includes('operat')) {
    pages = [
      {
        pageNumber: 1,
        chapterTitle: 'Unit 1: Introduction to Operating Systems & Architecture',
        topicTitle: 'Dual-Mode Operation, System Calls & Process Control Block (PCB)',
        keyConcepts: [
          'User Mode vs Kernel Mode (Privileged Bit 0/1)',
          'System Call Execution Flow via Trap / Software Interrupt',
          'Process States: New -> Ready -> Running -> Waiting -> Terminated',
          'PCB Structure: PID, Program Counter, CPU Registers, Memory Limits, Open Files'
        ],
        notesText: `An Operating System is a resource manager and extended machine providing an interface between application programs and hardware. In Dual-Mode operation, the hardware mode bit (0 for kernel, 1 for user) prevents errant user programs from wiping out the OS. When a program requests I/O, a trap instruction switches mode to 0, invokes the vector table in kernel memory, executes the sys_call, and returns to user space with mode bit 1.`,
        formulaOrCode: {
          label: 'System Call Trap Mechanism (Context Switch)',
          code: `// C Linux syscall invocation pattern
pid_t pid = fork();
if (pid == 0) {
    // Child process inherits address space copy
    execvp(args[0], args);
} else if (pid > 0) {
    // Parent process waits for child termination
    waitpid(pid, &status, 0);
}`
        },
        professorTip: 'Exam Alert: Frequently asked 5-marker: Draw the 5-state process transition diagram and explain when Preemption moves Running back to Ready.',
        practiceQuestion: 'Differentiate between monolithic and microkernel architectures with real-world OS examples.'
      },
      {
        pageNumber: 2,
        chapterTitle: 'Unit 2: CPU Scheduling & Multiprogramming',
        topicTitle: 'Preemptive vs Non-Preemptive Scheduling Algorithms',
        keyConcepts: [
          'Arrival Time (AT), Burst Time (BT), Completion Time (CT)',
          'Turnaround Time (TAT) = CT - AT',
          'Waiting Time (WT) = TAT - BT',
          'Response Time (RT) = First CPU allocation time - AT',
          'Round Robin Time Quantum selection trade-off (Context Switch overhead vs Responsiveness)'
        ],
        notesText: `CPU scheduling determines which process in the ready queue is allocated the CPU core. First-Come First-Served (FCFS) suffers from the Convoy Effect where small processes queue behind long CPU-bound tasks. Shortest Job First (SJF) is provably optimal for minimizing average waiting time but requires prediction of the next CPU burst (Exponential Average formula). Round Robin (RR) with time quantum q provides fair time-sharing.`,
        formulaOrCode: {
          label: 'Key Scheduling Numerical Formulas',
          code: `Turnaround Time (TAT) = Completion Time (CT) - Arrival Time (AT)
Waiting Time (WT)       = Turnaround Time (TAT) - Burst Time (BT)
Average WT              = (Sum of WT of all processes) / N
Predicted Next Burst    = tau_{n+1} = alpha * t_n + (1 - alpha) * tau_n`
        },
        professorTip: 'Numerical Tip: In Shortest Remaining Time First (SRTF), always construct the Gantt chart second-by-second at every process arrival point.',
        practiceQuestion: 'Given 4 processes with AT=[0,1,2,4] and BT=[5,3,8,6], calculate Average Waiting Time using Round Robin (q=2).'
      },
      {
        pageNumber: 3,
        chapterTitle: 'Unit 3: Process Synchronization & Concurrency',
        topicTitle: 'The Critical Section Problem & Semaphores',
        keyConcepts: [
          'Critical Section 3 Requirements: Mutual Exclusion, Progress, Bounded Waiting',
          'Hardware Support: TestAndSet(), CompareAndSwap() atomic instructions',
          'Counting vs Binary Semaphores (Mutex)',
          'Atomic Wait / P(S) and Signal / V(S) operations'
        ],
        notesText: `When multiple concurrent processes execute and access shared data, a race condition occurs where final results depend on execution order. The Critical Section problem requires: 1. Mutual Exclusion (only one process in critical section at any instant), 2. Progress (selection cannot be postponed indefinitely), 3. Bounded Waiting (limit on times other processes enter before a pending request). A semaphore S is an integer variable accessed only via atomic wait() [decrement and block if < 0] and signal() [increment and unblock].`,
        formulaOrCode: {
          label: 'Atomic Semaphore Primitive Definitions',
          code: `wait(Semaphore S) {
    S.value--;
    if (S.value < 0) {
        add this process to S.queue;
        block();
    }
}

signal(Semaphore S) {
    S.value++;
    if (S.value <= 0) {
        remove a process P from S.queue;
        wakeup(P);
    }
}`
        },
        professorTip: 'Common Student Mistake: Never say wait() does a while(S<=0) busy loop in OS kernels; modern OS blocks the thread on a sleep queue to save CPU cycles.',
        practiceQuestion: 'Show that Peterson\'s solution satisfies Mutual Exclusion, Progress, and Bounded Waiting for two processes.'
      },
      {
        pageNumber: 4,
        chapterTitle: 'Unit 4: Deadlocks & Resource Allocation',
        topicTitle: 'Deadlock 4 Conditions & Banker\'s Algorithm',
        keyConcepts: [
          'Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
          'Resource Allocation Graph (RAG) cycle analysis (Sufficient condition only for single instance resources)',
          'Banker\'s Algorithm: Available Vector, Max Matrix, Allocation Matrix, Need = Max - Allocation',
          'Safety Algorithm state transition testing'
        ],
        notesText: `A deadlock occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource held by another process. For avoidance, Dijkstra proposed the Banker's Algorithm. The system is in a Safe State if there exists a safe execution sequence <P1, P2, ..., Pn> where each process Pi can satisfy its maximum remaining request with current Available plus resources released by previously finished processes.`,
        formulaOrCode: {
          label: 'Banker\'s Safety Algorithm Logic',
          code: `Need[i][j] = Max[i][j] - Allocation[i][j]

Let Work = Available, Finish[i] = false for all i.
Find an index i such that:
    Finish[i] == false AND Need[i] <= Work
If found:
    Work = Work + Allocation[i];
    Finish[i] = true;
    Repeat search;
If all Finish[i] == true => Safe State!`
        },
        professorTip: 'Direct Exam Question: 10 Marks compulsory numerical in every semester exam! Always write down Need Matrix first before checking safety.',
        practiceQuestion: 'A system has 5 processes (P0-P4) and 3 resource types (A:10, B:5, C:7). Determine if the current state is safe.'
      },
      {
        pageNumber: 5,
        chapterTitle: 'Unit 5: Memory Management & Paging',
        topicTitle: 'Logical vs Physical Address Space, Paging & TLB',
        keyConcepts: [
          'Base and Limit Registers for Memory Protection',
          'Paging: Logical pages mapped to physical frames via Page Table',
          'Internal Fragmentation (present in paging) vs External Fragmentation (eliminated)',
          'Translation Lookaside Buffer (TLB) and Effective Access Time (EAT)'
        ],
        notesText: `Paging divides logical memory into fixed-size pages and physical memory into equal-size frames. The CPU generates a logical address containing Page Number (p) and Offset (d). The Memory Management Unit (MMU) indexes the Page Table at entry p to find Frame Number (f), creating physical address f * Frame_Size + d. To accelerate lookup, a high-speed hardware cache called TLB stores recent translations.`,
        formulaOrCode: {
          label: 'Effective Access Time (EAT) Calculation',
          code: `Given:
  TLB Hit Ratio = h (e.g. 90% = 0.9)
  TLB Lookup Time = c (e.g. 10 ns)
  Main Memory Access Time = m (e.g. 100 ns)

EAT = h * (c + m) + (1 - h) * (c + 2m)
// Explanation for miss: TLB check (c) + Page Table access (m) + Actual data access (m)`
        },
        professorTip: 'Formula to memorize: Multi-level paging page table size formula: Total Pages * Page Table Entry Size. Remember to calculate number of bits for offset: log2(page size).',
        practiceQuestion: 'Given a 32-bit virtual address, 4 KB page size, and 4-byte page table entry, calculate the size of a single-level page table.'
      },
      {
        pageNumber: 6,
        chapterTitle: 'Unit 6: Virtual Memory & Disk Scheduling',
        topicTitle: 'Page Replacement Algorithms (FIFO, LRU, Optimal) & Thrashing',
        keyConcepts: [
          'Demand Paging: Load page only when referenced (Valid/Invalid bit in Page Table)',
          'Page Fault Handling Routine flow (Trap -> Save Context -> Disk I/O -> Update PTE -> Restart)',
          'Belady\'s Anomaly: FIFO page faults can INCREASE when frames increase',
          'Optimal Replacement (Bélády MIN) - Benchmark with lowest page faults',
          'Least Recently Used (LRU) implemented via Counter or Stack',
          'Thrashing: System spends more time paging than executing; solved by Working Set Model'
        ],
        notesText: `Virtual memory separates user logical memory from physical storage, allowing programs larger than physical RAM. When an invalid page is accessed, the CPU triggers a Page Fault. The OS locates the page on backing store swap space, selects a victim frame using a Page Replacement Algorithm, swaps out victim if dirty (modified bit = 1), and reads the target page. Thrashing happens when the degree of multiprogramming is too high and sum of working sets exceeds available frames.`,
        formulaOrCode: {
          label: 'Page Replacement Comparison on Reference String [7, 0, 1, 2, 0, 3, 0, 4, 2, 3]',
          code: `Frames = 3
- FIFO:    Replaces oldest loaded page. (Vulnerable to Belady's anomaly)
- Optimal: Replaces page that will not be used for longest future period.
- LRU:     Replaces page that has not been used for longest past period.
Working Set Model: W(t, delta) = set of pages referenced in last delta time units.`
        },
        professorTip: 'Exam High-Yield: Always draw the reference string table showing step-by-step frame contents and mark Hits and Faults clearly for full marks.',
        practiceQuestion: 'Using LRU with 3 frames, find the number of page faults for reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5.'
      }
    ];
  } else if (subjectLower.includes('data') || subjectLower.includes('dsa') || titleLower.includes('dsa') || titleLower.includes('algorithm')) {
    pages = [
      {
        pageNumber: 1,
        chapterTitle: 'Module 1: Asymptotic Analysis & Master Theorem',
        topicTitle: 'Time-Space Complexity & Recurrence Relations',
        keyConcepts: [
          'Big-O (Upper Bound), Omega (Lower Bound), Theta (Tight Bound)',
          'Master Theorem: T(n) = a*T(n/b) + f(n)',
          'Case 1: f(n) = O(n^{log_b(a) - epsilon}) => T(n) = Theta(n^{log_b(a)})',
          'Case 2: f(n) = Theta(n^{log_b(a)} * log^k(n)) => T(n) = Theta(n^{log_b(a)} * log^{k+1}(n))',
          'Case 3: f(n) = Omega(n^{log_b(a) + epsilon}) & regularity condition => T(n) = Theta(f(n))'
        ],
        notesText: `Algorithm efficiency is quantified as a function of input size n independent of machine hardware. When dividing divide-and-conquer recurrences into a subproblems of size n/b with recombination work f(n), Master Theorem provides instantaneous asymptotic runtime without drawing recursion trees.`,
        formulaOrCode: {
          label: 'Standard Sorting Complexities Cheat Sheet',
          code: `Algorithm        Best         Average       Worst        Space
Quick Sort       O(n log n)   O(n log n)    O(n^2)       O(log n)
Merge Sort       O(n log n)   O(n log n)    O(n log n)   O(n)
Heap Sort        O(n log n)   O(n log n)    O(n log n)   O(1)
Count Sort       O(n + k)     O(n + k)      O(n + k)     O(k)`
        },
        professorTip: 'Placement Must-Know: Why is QuickSort preferred over MergeSort for arrays? Cache locality and zero extra auxiliary memory allocation!',
        practiceQuestion: 'Solve the recurrence relation T(n) = 2T(n/2) + n*log(n) using Master Theorem.'
      },
      {
        pageNumber: 2,
        chapterTitle: 'Module 2: Graph Representations & Traversals',
        topicTitle: 'BFS, DFS & Topological Sort (Kahn\'s Algorithm)',
        keyConcepts: [
          'Adjacency Matrix O(V^2) vs Adjacency List O(V + E)',
          'BFS: Queue-based level-order traversal, Shortest path in unweighted graphs',
          'DFS: Stack/recursion-based traversal, Backtracking, Cycle detection via 3-color scheme (White, Gray, Black)',
          'Topological Sort on Directed Acyclic Graph (DAG): Kahn\'s In-Degree 0 Queue method'
        ],
        notesText: `Graphs model relationships between entities. BFS explores all neighbor vertices at distance d before moving to distance d+1. DFS plunges deep down a branch until a dead-end or already discovered vertex is hit. For DAG scheduling, Topological Sort orders vertices such that for every directed edge u -> v, u appears before v.`,
        formulaOrCode: {
          label: 'Kahn\'s Algorithm for Topological Sort & Cycle Detection',
          code: `vector<int> topoSort(int V, vector<vector<int>>& adj) {
    vector<int> inDegree(V, 0);
    for (int u = 0; u < V; u++)
        for (int v : adj[u]) inDegree[v]++;
    
    queue<int> q;
    for (int i = 0; i < V; i++) if (inDegree[i] == 0) q.push(i);
    
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (--inDegree[v] == 0) q.push(v);
        }
    }
    return order.size() == V ? order : vector<int>(); // Empty if cycle exists!
}`
        },
        professorTip: 'Interview Trick: If Kahn\'s algorithm outputs fewer than V elements, the directed graph contains at least one cycle.',
        practiceQuestion: 'Explain how DFS can be used to find connected components in an undirected graph in O(V + E) time.'
      },
      {
        pageNumber: 3,
        chapterTitle: 'Module 3: Shortest Path Algorithms & Priority Queues',
        topicTitle: 'Dijkstra vs Bellman-Ford vs Floyd-Warshall',
        keyConcepts: [
          'Dijkstra: Greedy Single-Source Shortest Path (SSSP) on non-negative edge weights, O((V + E) log V)',
          'Bellman-Ford: Dynamic Programming SSSP, handles negative weights, detects negative cycles, O(V * E)',
          'Floyd-Warshall: All-Pairs Shortest Path (APSP), O(V^3) using intermediate vertex relaxation matrix',
          'Edge Relaxation formula: if (dist[u] + weight(u,v) < dist[v]) dist[v] = dist[u] + weight(u,v)'
        ],
        notesText: `Dijkstra selects the unvisited vertex with minimum tentative distance using a Min-Heap and relaxes its outgoing edges. It fails on negative weight edges because once a node is marked visited, its distance is assumed final. Bellman-Ford relaxes all E edges V-1 times. If an edge can still be relaxed in the V-th iteration, a negative weight cycle exists.`,
        formulaOrCode: {
          label: 'Dijkstra Implementation Template (C++ STL)',
          code: `priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
vector<int> dist(V, 1e9);
dist[src] = 0;
pq.push({0, src});

while (!pq.empty()) {
    auto [d, u] = pq.top(); pq.pop();
    if (d > dist[u]) continue; // Stale heap entry
    for (auto [v, w] : adj[u]) {
        if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            pq.push({dist[v], v});
        }
    }
}`
        },
        professorTip: 'Exam High-Yield: State precisely why Dijkstra cannot work with negative edges. Give a 3-node counterexample graph.',
        practiceQuestion: 'Apply Dijkstra\'s algorithm to find shortest distances from vertex A in a weighted graph with 6 vertices.'
      },
      {
        pageNumber: 4,
        chapterTitle: 'Module 4: Minimum Spanning Trees & Disjoint Sets',
        topicTitle: 'Kruskal\'s Algorithm, Prim\'s Algorithm & DSU with Path Compression',
        keyConcepts: [
          'MST Definition: Spanning tree with V vertices and V-1 edges minimizing total edge weight',
          'Kruskal\'s: Greedy edge-centric approach, Sort all edges in O(E log E), add edge if it connects different components',
          'Disjoint Set Union (DSU): Find with Path Compression, Union by Rank/Size => O(alpha(V)) amortized',
          'Prim\'s: Greedy vertex-centric growing tree from root, O(E log V)'
        ],
        notesText: `A Minimum Spanning Tree connects all vertices in a connected, edge-weighted undirected graph with no cycles. Kruskal sorts edges by ascending weight and inspects each edge (u, v): if find(u) != find(v), union(u, v) is executed and the edge is included in the MST. Path compression in find() flattens the tree directly pointing nodes to the root.`,
        formulaOrCode: {
          label: 'Disjoint Set Union (DSU) with Path Compression & Union By Rank',
          code: `struct DSU {
    vector<int> parent, rank;
    DSU(int n): parent(n), rank(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]); // Path compression!
    }
    bool unite(int i, int j) {
        int rootI = find(i), rootJ = find(j);
        if (rootI == rootJ) return false;
        if (rank[rootI] < rank[rootJ]) parent[rootI] = rootJ;
        else if (rank[rootI] > rank[rootJ]) parent[rootJ] = rootI;
        else { parent[rootJ] = rootI; rank[rootI]++; }
        return true;
    }
};`
        },
        professorTip: 'Viva Question: What is the inverse Ackermann function alpha(n)? For all practical universe sizes (n <= 10^80), alpha(n) <= 4, which is effectively constant time O(1)!',
        practiceQuestion: 'Compare Kruskal and Prim algorithms in terms of dense vs sparse graphs.'
      },
      {
        pageNumber: 5,
        chapterTitle: 'Module 5: Dynamic Programming Patterns',
        topicTitle: '0/1 Knapsack, Longest Common Subsequence (LCS) & Memoization',
        keyConcepts: [
          'Overlapping Subproblems and Optimal Substructure',
          'Top-Down (Recursion + Memoization table) vs Bottom-Up (Iterative Tabulation)',
          '0/1 Knapsack state: dp[i][w] = max value considering first i items with capacity w',
          'LCS state: if (s1[i]==s2[j]) 1 + dp[i-1][j-1] else max(dp[i-1][j], dp[i][j-1])',
          'Space optimization from O(N * W) to O(W) using 1D rolling array'
        ],
        notesText: `Dynamic Programming solves complex problems by breaking them into simpler subproblems and storing subproblem results to eliminate redundant computation. In 0/1 Knapsack, for each item i with weight wt[i] and value val[i], we make a binary choice: either exclude the item (dp[i-1][w]) or include it (val[i] + dp[i-1][w - wt[i]]), taking the maximum.`,
        formulaOrCode: {
          label: '0/1 Knapsack Space-Optimized 1D Tabulation',
          code: `int knapsack(int W, vector<int>& wt, vector<int>& val, int n) {
    vector<int> dp(W + 1, 0);
    for (int i = 0; i < n; i++) {
        // Iterate backwards so we don't reuse current item multiple times!
        for (int w = W; w >= wt[i]; w--) {
            dp[w] = max(dp[w], val[i] + dp[w - wt[i]]);
        }
    }
    return dp[W];
}`
        },
        professorTip: 'Critical Coding Pattern: When optimizing 2D DP to 1D array, iterate capacity backwards for 0/1 knapsack (single use) and forwards for Unbounded Knapsack (infinite use)!',
        practiceQuestion: 'Given two strings "AGGTAB" and "GXTXAYB", construct the DP table to find the Length of Longest Common Subsequence.'
      }
    ];
  } else if (subjectLower.includes('dbms') || titleLower.includes('dbms') || titleLower.includes('database')) {
    pages = [
      {
        pageNumber: 1,
        chapterTitle: 'Unit 1: Relational Model & SQL Fundamentals',
        topicTitle: 'Keys, Integrity Constraints & Relational Algebra',
        keyConcepts: [
          'Super Key, Candidate Key, Primary Key, Foreign Key (Referential Integrity)',
          'Entity Integrity: Primary key attribute cannot be NULL',
          'Relational Algebra Operations: Select (sigma), Project (pi), Cartesian Product (X), Natural Join (bowtie)',
          'SQL DDL vs DML vs DCL vs TCL commands'
        ],
        notesText: `A relational database represents data as tables (relations) comprising rows (tuples) and columns (attributes). A Candidate Key is a minimal super key with no extraneous attributes. Referential integrity enforces that any value in a foreign key column must match an existing primary key value in the referenced parent relation or be null.`,
        formulaOrCode: {
          label: 'Relational Algebra Expression for Subqueries',
          code: `-- Find student names enrolled in Operating Systems course
pi_{name} ( sigma_{course_name='OS'} (Students bowtie Enrolled bowtie Courses) )

-- Equivalent SQL with JOIN
SELECT S.name 
FROM Students S
JOIN Enrolled E ON S.id = E.student_id
JOIN Courses C ON E.course_id = C.id
WHERE C.course_name = 'OS';`
        },
        professorTip: 'Exam Alert: Differentiate between WHERE clause (filters individual rows before grouping) and HAVING clause (filters aggregated groups).',
        practiceQuestion: 'Write relational algebra and SQL queries to find employees whose salary is greater than the average salary of their department.'
      },
      {
        pageNumber: 2,
        chapterTitle: 'Unit 2: Functional Dependencies & Normalization',
        topicTitle: '1NF to BCNF Step-by-Step Normal Forms',
        keyConcepts: [
          'Functional Dependency (FD) X -> Y: If two tuples agree on X, they must agree on Y',
          'Attribute Closure X+: Set of all attributes functionally determined by X under F',
          '1NF: Atomic values only (no multi-valued or composite attributes)',
          '2NF: 1NF + No Partial Dependency (no non-prime attribute dependent on a proper subset of candidate key)',
          '3NF: 2NF + No Transitive Dependency (for every X -> Y, either X is Super Key or Y is Prime attribute)',
          'BCNF: For every non-trivial FD X -> Y, X must be a Super Key'
        ],
        notesText: `Normalization minimizes data redundancy and eliminates insertion, deletion, and update anomalies. In 1NF, every attribute cell holds atomic values. In 2NF, every non-prime attribute is fully functionally dependent on every candidate key. In 3NF, transitive dependency between non-prime attributes is eliminated. BCNF is a stricter version where the determinant must always be a super key.`,
        formulaOrCode: {
          label: 'Attribute Closure Algorithm & Candidate Key Testing',
          code: `To compute X+ under functional dependency set F:
1. Result = X
2. Repeat until no more changes:
   For each FD (A -> B) in F:
     If A is subset of Result:
       Result = Result UNION B
3. If Result == all relation attributes R => X is a Super Key!`
        },
        professorTip: 'Topper Shortcut: To find all candidate keys, look for attributes that never appear on the right side of any FD. Those attributes MUST be part of every candidate key!',
        practiceQuestion: 'Given R(A, B, C, D, E) with F = {A -> BC, CD -> E, B -> D, E -> A}. Find candidate keys and highest normal form.'
      },
      {
        pageNumber: 3,
        chapterTitle: 'Unit 3: Transactions & ACID Properties',
        topicTitle: 'Concurrency Control, 2-Phase Locking (2PL) & Serializability',
        keyConcepts: [
          'ACID: Atomicity (All-or-Nothing), Consistency, Isolation, Durability (Write-Ahead Logging)',
          'Conflict Serializability: Conflict equivalent to some serial schedule via non-conflicting swap',
          'Precedence Graph (Serialization Graph): Directed graph with edge Ti -> Tj if conflicting operation in Ti precedes Tj. Schedule is Conflict Serializable iff Graph has NO CYCLES!',
          'Two-Phase Locking (2PL): Growing Phase (acquire locks) -> Shrinking Phase (release locks)'
        ],
        notesText: `A transaction is a logical unit of database processing that includes one or more database access operations. To maintain consistency under concurrent execution, transactions must satisfy ACID properties. Two operations conflict if they belong to different transactions, access the same data item, and at least one is a write operation. Conflict serializability is verified by constructing a precedence graph.`,
        formulaOrCode: {
          label: 'Precedence Graph Cycle Detection for Serializability',
          code: `Schedule S: R1(A), W1(A), R2(A), W2(A), R1(B), W1(B)
Conflicting pairs:
- W1(A) precedes R2(A) => Edge T1 -> T2
- W1(A) precedes W2(A) => Edge T1 -> T2
Graph edges: { T1 -> T2 }
Result: Acyclic graph => Conflict Serializable!
Equivalent Serial Order: T1 -> T2`
        },
        professorTip: 'Viva Question: Does Basic 2PL guarantee freedom from deadlocks? NO! Basic 2PL guarantees serializability but can still suffer from deadlocks (e.g. Circular wait for locks).',
        practiceQuestion: 'Draw the precedence graph for schedule S: R1(X), R2(X), W1(X), W2(X) and determine if it is conflict serializable.'
      }
    ];
  } else {
    // Generic high-yield note template for uploaded or custom notes
    pages = [
      {
        pageNumber: 1,
        chapterTitle: `Overview: ${note.subject || 'Academic Revision Notes'}`,
        topicTitle: `${note.title || 'Comprehensive Subject Study Guide'}`,
        keyConcepts: [
          'Core Concept Fundamentals & Definitions',
          'Syllabus Weightage & Important High-Frequency Exam Topics',
          'Standard Architecture & Process Workflow Overview',
          'Verified Formulas, Key Theorems & Notations'
        ],
        notesText: note.description || 'Verified student study notes covering key theories, diagrams, step-by-step numerical derivations, and semester question papers.',
        formulaOrCode: {
          label: 'Summary Reference Table',
          code: `Subject:    ${note.subject}
Author:     ${note.author_name} (${note.university || 'Campus Faculty Certified'})
Semester:   ${note.semester} • ${note.branch}
Verified:   ${note.is_verified ? 'Yes (Faculty Gold Badge)' : 'Community Peer Reviewed'}`
        },
        professorTip: 'Recommended Study Flow: Review each formula box, solve the end-of-unit practice questions, and attempt the CampusSathi AI Quiz.',
        practiceQuestion: `Explain the fundamental principles and practical applications of ${note.subject}.`
      },
      {
        pageNumber: 2,
        chapterTitle: 'Unit 2: Detailed Technical Breakdown & Analytical Methods',
        topicTitle: 'Key Equations, Step-by-Step Derivations & Diagrams',
        keyConcepts: [
          'Theoretical Foundations & Governing Equations',
          'Comparative Analysis of Common Approaches & Trade-offs',
          'Edge Cases & Error Handling Considerations',
          'Standard Numerical Problem Solving Blueprint'
        ],
        notesText: `Detailed lecture derivations and exam-ready notes. Ensure clarity on input constraints, assumptions, and physical/logical interpretations. Always begin proofs by stating the formal assumptions and define all terms used.`,
        formulaOrCode: {
          label: 'Standard Equation Blueprint',
          code: `// Universal problem solving template
1. Identify Given Parameters & Target Output
2. State Relevant Laws / Principles & Boundary Conditions
3. Step-by-step Algebraic / Logical Derivation
4. Final Numerical Result with Units & Dimension Check`
        },
        professorTip: 'Exam Presentation Tip: Draw clean, boxed equations and highlight final answers with double underlines for maximum examiner marks.',
        practiceQuestion: 'Derive the main formula governing this unit and state three practical engineering applications.'
      },
      {
        pageNumber: 3,
        chapterTitle: 'Unit 3: Past Year Questions (PYQs) & Placement Focus',
        topicTitle: 'Most Frequently Asked Semester Exam Questions & Solutions',
        keyConcepts: [
          'Top 5 Compulsory Exam Questions Analyzed',
          'Common Student Mistakes & Mark Deduction Traps',
          'Quick Revision Flashcards & Mnemonics',
          'High-Yield Summary for 24-Hour Pre-Exam Cramming'
        ],
        notesText: `Compiled from the last 5 years of university question papers. Questions marked with asterisks have appeared in 3 or more consecutive exam sessions. Focus on neat diagrams and structured bullet points during final exams.`,
        formulaOrCode: {
          label: 'Quick Revision Checklist',
          code: `[x] Definitions & Stated Laws memorized
[x] Diagram labeling practiced twice on paper
[x] Numerical formulas & unit conversions verified
[x] 3 solved past semester questions completed`
        },
        professorTip: 'Best Strategy: Complete this unit at least 2 days before the exam, then test your retention with CampusSathi AI Voice Viva!',
        practiceQuestion: 'Summarize the primary differences between the competing methods discussed in this chapter.'
      }
    ];
  }

  // Ensure total structured pages strictly matches note.page_count so page numbers are real and consistent!
  const targetPageCount = Math.max(1, note.page_count || pages.length || 1);
  const subjectName = note.subject || 'Engineering & Sciences';

  while (pages.length < targetPageCount) {
    const nextPg = pages.length + 1;
    const unitNum = Math.floor((nextPg - 1) / 4) + 1;
    const isPyq = nextPg % 3 === 0;
    const isFormula = nextPg % 3 === 2;

    pages.push({
      pageNumber: nextPg,
      chapterTitle: `Unit ${unitNum}: Advanced ${subjectName} Core Principles`,
      topicTitle: isPyq 
        ? `Solved Past Year University Questions & Detailed Derivations (Part ${Math.ceil(nextPg / 3)})`
        : isFormula
        ? `Numerical Problem Solutions, Step-by-Step Proofs & Formulas`
        : `Key Theoretical Frameworks, Architectural Schematics & Exam Crux`,
      keyConcepts: [
        `High-yield concept ${nextPg}.1: Systematic architecture & structural breakdown`,
        `High-yield concept ${nextPg}.2: University exam derivation with boundary conditions`,
        `High-yield concept ${nextPg}.3: Time & space efficiency trade-offs and complexity analysis`,
        `High-yield concept ${nextPg}.4: Industry practical applications and case studies`
      ],
      notesText: `This section details the vital core concepts of ${subjectName} for page ${nextPg} of ${targetPageCount}. Students are advised to focus on step-by-step mathematical reasoning, standard notations, and clean diagrams during mid-term and semester examinations.`,
      formulaOrCode: {
        label: `Key Formulation / Standard Reference (Page ${nextPg})`,
        code: `// Analysis formulation for ${subjectName} (Page ${nextPg})
Result = Evaluate(${subjectName.replace(/[^a-zA-Z]/g, '')}_Model, Param_Alpha, Delta_Step);
Efficiency = Optimal_Ratio(Input_N, Complexity_Log);`
      },
      professorTip: `Exam Tip (Page ${nextPg}): Frequently tested in Section B/C (7-10 marks). Write points sequentially with underlined keywords.`,
      practiceQuestion: `State and prove the fundamental theorems associated with ${subjectName} for Unit ${unitNum}.`
    });
  }

  return {
    noteId: note.id,
    title: note.title,
    subject: note.subject,
    authorName: note.author_name,
    university: note.university || 'AKTU',
    semester: note.semester || 'Sem 4',
    branch: note.branch || 'Computer Science',
    totalPages: targetPageCount,
    price: note.price || 0,
    stars: note.stars || 5.0,
    downloads: note.downloads || 0,
    pages
  };
}

// Generate valid, standard PDF 1.4 binary buffer without any native dependencies
export function generateValidPdfBuffer(data: NotePreviewData): Buffer {
  const sanitize = (text: string) => {
    return text.replace(/[\\()]/g, '').replace(/[^\x20-\x7E]/g, ' ');
  };

  const pages = data.pages;
  const pageCount = pages.length;

  // We will build objects
  // 1: Catalog
  // 2: Font Helvetica
  // 3: Font Helvetica-Bold
  // 4: Pages container
  // 5..(4 + 2*pageCount): Page objects and Content stream objects
  const objects: string[] = [];

  // Catalog
  objects[1] = `<< /Type /Catalog /Pages 4 0 R >>`;
  // Fonts
  objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  const pageObjIds: number[] = [];
  let nextObjId = 5;

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = nextObjId++;
    const contentObjId = nextObjId++;
    pageObjIds.push(pageObjId);

    const page = pages[i];

    // Construct stream lines
    const streamLines: string[] = [];
    streamLines.push('q'); // save state

    // Decorative Header band
    streamLines.push('0.95 0.96 0.98 rg'); // Light slate gray
    streamLines.push('30 790 535 32 re f'); // Rect fill
    streamLines.push('0.85 0.88 0.92 RG'); // Stroke color
    streamLines.push('1 w');
    streamLines.push('30 790 535 32 re S');

    // Header Text
    streamLines.push('BT');
    streamLines.push('/F2 10 Tf');
    streamLines.push('0.15 0.25 0.45 rg');
    streamLines.push(`40 802 Td (${sanitize(data.subject)} - CampusSathi AI Verified Notes) Tj`);
    streamLines.push('ET');

    streamLines.push('BT');
    streamLines.push('/F1 9 Tf');
    streamLines.push('0.4 0.45 0.55 rg');
    streamLines.push(`460 802 Td (Page ${page.pageNumber} of ${data.totalPages}) Tj`);
    streamLines.push('ET');

    // Watermark
    streamLines.push('q');
    streamLines.push('0.93 0.93 0.93 rg');
    streamLines.push('BT');
    streamLines.push('/F2 36 Tf');
    streamLines.push('120 420 Td (CAMPUSSATHI VERIFIED) Tj');
    streamLines.push('ET');
    streamLines.push('Q');

    // Title & Topic
    streamLines.push('BT');
    streamLines.push('/F2 14 Tf');
    streamLines.push('0.9 0.35 0.1 rg'); // Orange accent
    streamLines.push(`40 760 Td (${sanitize(page.chapterTitle.slice(0, 65))}) Tj`);
    streamLines.push('ET');

    streamLines.push('BT');
    streamLines.push('/F2 12 Tf');
    streamLines.push('0.1 0.1 0.15 rg');
    streamLines.push(`40 740 Td (${sanitize(page.topicTitle.slice(0, 70))}) Tj`);
    streamLines.push('ET');

    // Author sub-banner
    streamLines.push('BT');
    streamLines.push('/F1 9 Tf');
    streamLines.push('0.45 0.5 0.55 rg');
    streamLines.push(`40 722 Td (Author: ${sanitize(data.authorName)} | ${sanitize(data.university)} - ${sanitize(data.semester)}) Tj`);
    streamLines.push('ET');

    // Horizontal divider
    streamLines.push('0.85 0.85 0.88 RG');
    streamLines.push('40 712 m 565 712 l S');

    // Key Concepts section
    streamLines.push('BT');
    streamLines.push('/F2 10 Tf');
    streamLines.push('0.15 0.25 0.5 rg');
    streamLines.push('40 692 Td (KEY EXAM CONCEPTS & SUMMARY:) Tj');
    streamLines.push('ET');

    let currentY = 674;
    for (const concept of page.keyConcepts.slice(0, 4)) {
      streamLines.push('BT');
      streamLines.push('/F1 9 Tf');
      streamLines.push('0.2 0.2 0.25 rg');
      streamLines.push(`50 ${currentY} Td (* ${sanitize(concept.slice(0, 85))}) Tj`);
      streamLines.push('ET');
      currentY -= 15;
    }

    // Detailed notes block
    currentY -= 10;
    streamLines.push('BT');
    streamLines.push('/F2 10 Tf');
    streamLines.push('0.15 0.25 0.5 rg');
    streamLines.push(`40 ${currentY} Td (EXPLANATION & LECTURE DERIVATION:) Tj`);
    streamLines.push('ET');
    currentY -= 18;

    // Split notes text into lines of ~80 chars
    const words = page.notesText.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 82) {
        streamLines.push('BT');
        streamLines.push('/F1 9 Tf');
        streamLines.push('0.15 0.15 0.2 rg');
        streamLines.push(`40 ${currentY} Td (${sanitize(line)}) Tj`);
        streamLines.push('ET');
        currentY -= 14;
        line = w;
        if (currentY < 480) break;
      } else {
        line = line ? line + ' ' + w : w;
      }
    }
    if (line && currentY >= 480) {
      streamLines.push('BT');
      streamLines.push('/F1 9 Tf');
      streamLines.push('0.15 0.15 0.2 rg');
      streamLines.push(`40 ${currentY} Td (${sanitize(line)}) Tj`);
      streamLines.push('ET');
      currentY -= 16;
    }

    // Formula or Code box if present
    if (page.formulaOrCode) {
      currentY -= 10;
      const boxHeight = 110;
      streamLines.push('0.94 0.95 0.97 rg'); // code bg
      streamLines.push(`40 ${currentY - boxHeight + 15} 525 ${boxHeight} re f`);
      streamLines.push('0.8 0.82 0.88 RG');
      streamLines.push(`40 ${currentY - boxHeight + 15} 525 ${boxHeight} re S`);

      streamLines.push('BT');
      streamLines.push('/F2 9 Tf');
      streamLines.push('0.1 0.3 0.6 rg');
      streamLines.push(`50 ${currentY} Td ([${sanitize(page.formulaOrCode.label)}]) Tj`);
      streamLines.push('ET');

      let codeY = currentY - 16;
      const codeLines = page.formulaOrCode.code.split('\n').slice(0, 6);
      for (const cl of codeLines) {
        streamLines.push('BT');
        streamLines.push('/F1 8 Tf');
        streamLines.push('0.1 0.1 0.15 rg');
        streamLines.push(`50 ${codeY} Td (${sanitize(cl.slice(0, 95))}) Tj`);
        streamLines.push('ET');
        codeY -= 13;
      }
      currentY -= (boxHeight + 10);
    }

    // Professor Exam Tip Box
    if (page.professorTip && currentY > 160) {
      streamLines.push('1.0 0.97 0.9 rg'); // warm amber tint
      streamLines.push(`40 ${currentY - 35} 525 35 re f`);
      streamLines.push('0.95 0.7 0.3 RG');
      streamLines.push(`40 ${currentY - 35} 525 35 re S`);

      streamLines.push('BT');
      streamLines.push('/F2 9 Tf');
      streamLines.push('0.7 0.35 0.05 rg');
      streamLines.push(`50 ${currentY - 14} Td (FACULTY EXAM TIP:) Tj`);
      streamLines.push('ET');

      streamLines.push('BT');
      streamLines.push('/F1 8.5 Tf');
      streamLines.push('0.3 0.2 0.05 rg');
      streamLines.push(`50 ${currentY - 26} Td (${sanitize(page.professorTip.slice(0, 95))}) Tj`);
      streamLines.push('ET');
      currentY -= 50;
    }

    // Footer bar
    streamLines.push('0.85 0.85 0.88 RG');
    streamLines.push('40 45 m 565 45 l S');

    streamLines.push('BT');
    streamLines.push('/F1 8 Tf');
    streamLines.push('0.5 0.5 0.55 rg');
    streamLines.push('40 32 Td (CampusSathi AI - Smart College Study Hub & Marketplace | Instant Delivery Printing Available) Tj');
    streamLines.push('ET');

    streamLines.push('Q'); // restore state

    const streamContent = streamLines.join('\n');
    const streamLength = Buffer.byteLength(streamContent, 'utf-8');

    // Content object
    objects[contentObjId] = `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`;

    // Page object
    objects[pageObjId] = `<< /Type /Page /Parent 4 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 2 0 R /F2 3 0 R >> >> /Contents ${contentObjId} 0 R >>`;
  }

  // Pages container object
  objects[4] = `<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`;

  // Assemble full PDF
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const xrefOffsets: number[] = [0];

  for (let id = 1; id < nextObjId; id++) {
    xrefOffsets[id] = Buffer.byteLength(pdf, 'utf-8');
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${nextObjId}\n0000000000 65535 f \n`;

  for (let id = 1; id < nextObjId; id++) {
    const offsetStr = String(xrefOffsets[id]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${nextObjId} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}
