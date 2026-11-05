'use client';
import { useState, useEffect } from 'react';

const PARTIES = [
  "ANC", "DA", "EFF", "MK Party", "IFP", "Freedom Front Plus", "ActionSA", "ACDP", "UDM", "ATM", "Good", "PAC", "Al Jama-ah", "Rise Mzansi", "Build One South Africa", "Operation Dudula", "PA", "NCC", "UAT", "Hope4sa", "AM4C", "UIM", "AIC", "NFP", "AZAPO", "ACT", "AHC", "COPE", "APC", "ABC", "AL", "AADP", "AAR", "ARA", "ACM", "AFRICAN MOVEMENT CONGRESS", "APEMO", "ACP", "A.C.C", "CITIZANS", "CIASA", "DLC", "ELF-SA", "F4SD", "FREE DEMOCRATS", "PAM", "PFA", "PDM", "PRM", "SAPP", "UCDP", "WASP"
];

const REGIONS = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

export default function Home() {
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('Gauteng'); // Default region for voting
  const [contender, setContender] = useState(PARTIES[0]);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
 
  // State for Results
  const [results, setResults] = useState<Record<string, Record<string, number>>>({});
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/results`);
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Failed to load results");
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Processing...');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber, address, contenderId: contender, consent, region }),
      });

      const data = await res.json();
     
      if (res.ok) {
        setMessage('✅ ' + data.message);
        fetchResults(); // Instantly update the live counter!
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Network error.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 space-y-8">
     
      {/* --- VOTING SECTION --- */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
       
        {/* SA FLAG AND SLOGAN BANNER */}
        <div className="flex flex-col items-center justify-center mb-6 bg-gradient-to-r from-green-700 via-yellow-500 to-blue-700 p-4 rounded-lg shadow-inner text-white">
          <div className="text-5xl mb-2 drop-shadow-md">🇿🇦</div>
          <h1 className="text-2xl font-extrabold text-center tracking-wide drop-shadow-md">
            SA Voting App
          </h1>
          <p className="text-sm font-semibold text-center mt-1 text-white drop-shadow-sm uppercase tracking-widest">
            Free and Fair EleXions
          </p>
        </div>

        <form onSubmit={handleVote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SA ID Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
              required
              maxLength={13}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Province / Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Political Party</label>
            <select
              value={contender}
              onChange={(e) => setContender(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
            >
              {PARTIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
            <p className="text-xs text-gray-600 mb-2">
              To vote, we must collect and encrypt your ID number to verify you are a South African citizen and prevent double voting. Your data will be deleted after the election.
            </p>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">I consent to the processing of my data.</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!consent}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            Cast Vote
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center font-medium text-gray-800">{message}</p>
        )}
      </div>

      {/* --- LIVE RESULTS SECTION --- */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Live Results by Province</h2>
       
        {isLoadingResults ? (
          <p className="text-center text-gray-500">Connecting to database...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REGIONS.map((r) => {
              const provinceResults = results[r] || {};
              const hasVotes = Object.keys(provinceResults).length > 0;

              return (
                <div key={r} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                  <h3 className="font-bold text-lg text-blue-800 border-b pb-2 mb-3">{r}</h3>
                 
                  {!hasVotes ? (
                    <p className="text-sm text-gray-500 italic">No votes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(provinceResults)
                        .sort(([, a], [, b]) => b - a) // Sort highest to lowest
                        .map(([party, votes]) => (
                        <div key={party} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700">{party}</span>
                          <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded border">{votes}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}