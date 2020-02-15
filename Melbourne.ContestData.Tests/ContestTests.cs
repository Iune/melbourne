using Melbourne.ContestData;
using NUnit.Framework;
using System.Collections.Generic;

namespace Melbourne.ContestData.Tests
{
    public class ContestTests
    {
        private Contest contest;

        [SetUp]
        public void Setup()
        {
            List<Entry> entries = new List<Entry>()
            {
                new Entry("Estonia", "World/ee.png", "Ines", "Once in a Lifetime", new List<string>() { "X", "12", "12", "12", "" }),
                new Entry("Latvia", "World/lv.png", "Brainstorm", "My Star", new List<string>() { "12", "X", "10", "10", "" }),
                new Entry("Russia", "World/ru.png", "Alsou", "Solo", new List<string>() { "10", "8", "X", "8", "" }),
                new Entry("Denmark", "World/dk.png", "Olson Brothers", "Fly on the Wings of Love", new List<string>() { "8", "10", "8", "X", "" }),
                new Entry("Hungary", "World/hu.png", "", "", new List<string>() { "7", "7", "7", "7", "DQ" })
            };

            List<string> voters = new List<string>() { "Estonia", "Latvia", "Russia", "Denmark", "Hungary" };
            contest = new Contest(entries, voters);
        }

        [Test]
        public void TestNumVoters()
        {
            Assert.AreEqual(5, contest.NumVoters);
        }

        [Test]
        public void TestNumEntries()
        {
            Assert.AreEqual(5, contest.NumEntries);
        }

        [Test]
        public void TestWinner()
        {
            Assert.AreEqual("Estonia", contest.FinalResults[0].Country);
            Assert.AreEqual(36, contest.FinalResults[0].DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(3, contest.FinalResults[0].VoterCount[contest.NumVoters - 1]);
        }

        [Test]
        public void TestTieBreaking()
        {
            Entry denmark = contest.FinalResults[2];
            Entry russia = contest.FinalResults[3];

            Assert.AreEqual("Denmark", denmark.Country);
            Assert.AreEqual("Russia", russia.Country);
            Assert.AreEqual(26, denmark.DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(26, russia.DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(3, denmark.VoterCount[contest.NumVoters - 1]);
            Assert.AreEqual(3, russia.VoterCount[contest.NumVoters - 1]);
        }

        [Test]
        public void TestDisqualification()
        {
            Entry hungary = contest.FinalResults[contest.NumVoters - 1];

            Assert.AreEqual("Hungary", hungary.Country);
            Assert.AreEqual(28, hungary.DisplayPoints[contest.NumVoters - 1]);
            Assert.AreEqual(-1000, hungary.SortingPoints[contest.NumVoters - 1]);
            Assert.AreEqual(true, hungary.DisqualificationStatus[contest.NumVoters - 1]);
        }
    }
}