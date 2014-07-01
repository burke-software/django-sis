from rest_framework.test import APITestCase
from ecwsp.sis.sample_data import SisData

class APITest(APITestCase):
    """
    test the implementation of our API

    We're using Django-Rest-Framework's testing base (which extends Django's)
    """

    def setUp(self):
        """
        set up the testing environment
        """
        self.populate_database()

    def populate_database(self):
        """ Extend me with more data to populate """
        self.data = SisData()
        self.data.create_basics()

