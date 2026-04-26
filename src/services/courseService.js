import axios from './httpRequester';

const path = '/course';

class CourseService{

    async courseList(params){
        const res = await axios.get(path, {params})
        return res.data;
    }

    async myCourseList() {
        const res = await axios.get(`${path}/my`)
        return res.data;
    }

    async courseDel(params){
        const res = await axios.delete(path, { params })
        return res.data;
    }

    async postCourse(data){
        const res = await axios.post(path, data)
        return res.data;
    }

    async getCourseMaxPage(params){
        const res =  await axios.get(`${path}/max_page`, { params });
        return res.data;
  }

}

export default new CourseService();