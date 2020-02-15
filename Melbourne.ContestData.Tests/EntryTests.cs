using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;

namespace Melbourne.ContestData.Tests
{
    public class EntryTests
    {
        private Entry entry;

        [SetUp]
        public void Setup()
        {
            entry = new Entry("Hungary", "World/hu.png", "", "", new List<string>() { "7", "7", "7", "7", "DQ" });
        }

        [Test]
        public void TestVoterCount()
        {
            Assert.AreEqual(4, entry.VoterCount.Last());
        }

        [Test]
        public void TestDisplayPoints()
        {
            Assert.AreEqual(28, entry.DisplayPoints.Last());
        }

        [Test]
        public void TestSortingPoints()
        {
            Assert.AreEqual(-1000, entry.SortingPoints.Last());
        }

        [Test]
        public void TestDisqualificationStatus()
        {
            Assert.IsFalse(entry.DisqualificationStatus.First());
            Assert.IsTrue(entry.DisqualificationStatus.Last());
        }
    }
}
