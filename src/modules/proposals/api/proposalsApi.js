const BASE_URL = '/api/proposals';

export const proposalsApi = {
  async getProposals() {
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching proposals:', error);
      throw error;
    }
  },

  async getProposalById(id) {
    const response = await fetch(`${BASE_URL}/${id}`);
    return response.json();
  },

  async createProposal(data) {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  },

  async updateProposal(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteProposal(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
    } catch (error) {
      console.error('Error deleting proposal:', error);
      throw error;
    }
  },
}; 