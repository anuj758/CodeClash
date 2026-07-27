const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createBatch = (judge0LanguageId, source_code, input, expected_output = [], timeLimit = 5.0, memoryLimit = 262144) => {
    const batch = input.map((testInput, i) => {
        const item = {
            language_id: judge0LanguageId,
            source_code,
            stdin: testInput || '',
            cpu_time_limit: timeLimit,
            cpu_extra_time: 1.0, 
            memory_limit: memoryLimit
        };

        // Only attach expected_output if available
        if (expected_output && expected_output[i] !== undefined) {
            item.expected_output = expected_output[i];
        }

        return item;
    });

    return { submissions: batch };
};

const computeOutput = async (batch) => {
    try {
        const postRes = await axios.post(
            `${process.env.JUDGE0}/submissions/batch?base64_encoded=false`,
            batch
        );

        const tokens = postRes.data.map(item => item.token).join(',');
        
        while (true) {
            const getRes = await axios.get(
                `${process.env.JUDGE0}/submissions/batch?tokens=${tokens}&base64_encoded=false`
            );

            const submissions = getRes.data.submissions;
            const allFinished = submissions.every(sub => sub.status && sub.status.id > 2);

            if (allFinished) {
                return submissions.map(({ token, ...rest }) => rest);
            }

            await sleep(1000); 
        }
    } catch (err) {
        throw new Error(`Judge0 Execution Failed: ${err.message}`);
    }
};

const isAccepted = async ({ judge0LanguageId, source_code, input, expected_output, timeLimit, memoryLimit }) => {
    const batch = createBatch(judge0LanguageId, source_code, input, expected_output, timeLimit, memoryLimit);
    const result = await computeOutput(batch);
    
    let failedTestCase = null;
    let maxMemory = 0;
    let totalTime = 0;
    let acceptedTestCases = 0;
    let overallStatus = { id: 3, description: 'Accepted' };

    for (let i = 0; i < result.length; i++) {
        const currentResult = result[i];

        const caseTime = parseFloat(currentResult.time) || 0;
        const caseMemory = parseInt(currentResult.memory, 10) || 0;

        maxMemory = Math.max(maxMemory, caseMemory);
        totalTime += caseTime;

        if (currentResult.status.id === 3) {
            acceptedTestCases++;
        } else if (!failedTestCase) {
            overallStatus = currentResult.status;
            failedTestCase = {
                input: input[i],
                expected_output: expected_output[i],
                actual_output: currentResult.stdout || '',
                runTimeError: currentResult.stderr || '',
                compilationError: currentResult.compile_output || ''
            };
        }
    }

    const averageTime = result.length > 0 ? totalTime / result.length : 0;

    if (failedTestCase) {
        return {
            isAccepted: false,
            acceptedTestCases,
            totalTestCases: expected_output.length,
            failedTestCase,
            time: parseFloat(averageTime.toFixed(3)),
            memory: maxMemory,
            status: overallStatus
        };
    }

    return {
        isAccepted: true,
        acceptedTestCases,
        totalTestCases: expected_output.length,
        time: parseFloat(averageTime.toFixed(3)),
        memory: maxMemory,
        status: overallStatus
    };
};

const runAndCheck = async ({ judge0LanguageId, code, input, timeLimit, memoryLimit }) => {
    const batch = createBatch(judge0LanguageId, code, input, [], timeLimit, memoryLimit);
    const result = await computeOutput(batch);

    
    return result.map((r, idx) => ({
        input: input[idx],
        ...r
    }));
};

module.exports = {
    isAccepted,
    runAndCheck
};