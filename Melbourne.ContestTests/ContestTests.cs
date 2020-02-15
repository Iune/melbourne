using NUnit.Framework;
using Melbourne.Contest;
using System.IO;
using System;

namespace Melbourne.ContestTests
{
    public class ContestTests
    {
        private Contest.Contest contest;

        [SetUp]
        public void Setup()
        {
            contest = new Contest.Contest("/Users/aditya/Desktop/FSC 199.xlsx");
        }

        [Test]
        public void TestNumVoters()
        {
            Assert.AreEqual(43, contest.NumVoters);
        }

        [Test]
        public void TestNumEntries()
        {
            Assert.AreEqual(43, contest.NumEntries);
        }

        [Test]
        public void TestWinner()
        {
            Assert.AreEqual("Slovenia", contest.FinalResults[0].Country);
            Assert.AreEqual(178, contest.FinalResults[0].DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(26, contest.FinalResults[0].VoterCount[contest.NumVoters - 1]);
        }

        [Test]
        public void TestTieBreaking()
        {
            Entry china = contest.FinalResults[14];
            Entry armenia = contest.FinalResults[15];

            Assert.AreEqual("China", china.Country);
            Assert.AreEqual("Armenia", armenia.Country);
            Assert.AreEqual(61, china.DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(61, armenia.DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(12, china.VoterCount[contest.NumVoters - 1]);
            Assert.AreEqual(10, armenia.VoterCount[contest.NumVoters - 1]);
        }
    }
}